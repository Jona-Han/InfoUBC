import {InsightDatasetKind, InsightError, InsightResult, ResultTooLargeError} from "../controller/IInsightFacade";
import {
	ApplyToken,
	Filter,
	IQuery,
	JSONQuery,
	Logic,
	LogicComparison,
	MComparator,
	MComparison,
	MField,
	Negation,
	Options,
	RoomMField,
	SComparison,
	SField,
	Sort,
	Transformations,
} from "./IQuery";
import * as fs from "fs-extra";
import QueryValidator from "./QueryValidator";
import Sections, {Section} from "./Sections";
import {Room} from "./Rooms";
import Decimal from "decimal.js";
import {
	applyRules,
	orderSectionsBySortObject,
	orderSectionsByString,
	validateKeyMatchesKind,
} from "../utils/QueryUtils";

export class Query implements IQuery {
	public WHERE: Filter;
	public OPTIONS: Options;
	public TRANSFORMATIONS?: Transformations;
	public datasetName: string;

	private directory = "./data";
	private data: Sections;
	private datasetKind: InsightDatasetKind | undefined;

	constructor(queryJSON: JSONQuery) {
		let QV: QueryValidator = new QueryValidator();
		this.datasetName = QV.validateQuery(queryJSON);
		this.WHERE = queryJSON.WHERE;
		this.OPTIONS = queryJSON.OPTIONS;
		this.TRANSFORMATIONS = queryJSON.TRANSFORMATIONS;
		this.datasetKind = undefined;
		this.data = new Sections(this.datasetName);
	}

	public execute(): InsightResult[] {
		if (!fs.pathExistsSync(this.directory + "/" + this.datasetName + ".json")) {
			throw new InsightError(`Cannot query from ${this.datasetName} due to not being added yet.`);
		}
		this.loadData();
		const afterWhere = this.handleWhere(this.WHERE);

		// Parse WHERE data into a map
		const allSections = this.data.getSectionsAsMap();
		const selectedSections: Section[] = [];
		afterWhere.forEach((uuid) => {
			const section = allSections.get(uuid);
			if (section) {
				selectedSections.push(section);
			}
		});

		const afterTransform = this.handleTransformations(selectedSections);
		return this.handleOptions(afterTransform);
	}

	private loadData() {
		const object = fs.readJSONSync(this.directory + "/" + this.datasetName + ".json");
		this.datasetKind = object.kind;
		this.data.addSections(object.sections, false);
	}

	private handleWhere(input: Filter): Set<string> {
		if (!input) {
			throw new InsightError("this.WHERE should not be NULL after query validated");
		} else if ("AND" in input || "OR" in input) {
			return this.handleLogicComparison(input as LogicComparison);
		} else if ("LT" in input || "GT" in input || "EQ" in input) {
			return this.handleMComparison(input as MComparison);
		} else if ("IS" in input) {
			return this.handleSComparison(input as SComparison);
		} else if ("NOT" in input) {
			return this.handleNegation(input as Negation);
		} else {
			const all = new Set<string>();
			this.data.getSections().forEach((section) => {
				all.add(section.uuid);
			});
			return all;
		}
	}

	private handleTransformations(input: any[]): any[] {
		if (this.TRANSFORMATIONS) {
			const groupings = this.handleGrouping(input);

			return this.handleApply(groupings);
		}
		return input;
	}

	private handleGrouping(selectedSections: any[]): Map<string, any[]> {
		const groupings = new Map<string, any[]>();

		selectedSections.forEach((section) => {
			const tuple = this.TRANSFORMATIONS?.GROUP.map((key) => {
				validateKeyMatchesKind(key, this.datasetKind);
				return `${key}__${section[key.split("_")[1]]}`;
			}).join("||");

			if (!groupings.has(tuple as string)) {
				groupings.set(tuple as string, []);
			}

			groupings.get(tuple as string)?.push(section);
		});

		return groupings;
	}

	private handleApply(input: Map<string, any[]>): any[] {
		const results: any[] = [];

		for (const [encodedTuple, sections] of input.entries()) {
			const result: any = {};
			applyRules(sections, result, this.TRANSFORMATIONS?.APPLY, this.datasetKind);

			// Add order keys back to object
			const decodedTuples = encodedTuple.split("||");
			decodedTuples.map((tuple) => {
				let [key] = tuple.split("__");
				key = key.split("_")[1];
				result[key] = sections[0][key];
			});
			results.push(result);
		}

		return results;
	}

	private handleNegation(input: Negation): Set<string> {
		// Handle the filter inside the NOT and get its result.
		const innerResult = this.handleWhere(input.NOT);

		// Subtract innerResult from allUUIDs to get the result of the NOT filter.
		const negationResult = new Set<string>();
		this.data.getSections().forEach((section) => {
			if (!innerResult.has(section.uuid)) {
				negationResult.add(section.uuid);
			}
		});

		return negationResult;
	}

	public handleSComparison(input: SComparison): Set<string> {
		const sectionMappings = new Set<string>();
		const key = Object.keys(input.IS)[0]; // Dataset name + SField
		validateKeyMatchesKind(key, this.datasetKind);
		const sField = key.split("_")[1] as SField; // SField
		const sValue = input.IS[key];

		this.data.getSections().forEach((section: any) => {
			if (sValue.startsWith("*") && sValue.endsWith("*")) {
				// Contains inputstring
				if (section[sField].includes(sValue.substring(1, sValue.length - 1))) {
					sectionMappings.add(section.uuid);
				}
			} else if (sValue.startsWith("*")) {
				// Ends with inputstring
				if (section[sField].endsWith(sValue.substring(1))) {
					sectionMappings.add(section.uuid);
				}
			} else if (sValue.endsWith("*")) {
				// Starts with inputstring
				if (section[sField].startsWith(sValue.substring(0, sValue.length - 1))) {
					sectionMappings.add(section.uuid);
				}
			} else {
				// Matches inputstring exactly
				if (section[sField] === sValue) {
					sectionMappings.add(section.uuid);
				}
			}
		});
		return sectionMappings;
	}

	private handleMComparison(input: MComparison): Set<string> {
		const sectionMappings = new Set<string>();
		const compareKey: keyof MComparison = Object.keys(input)[0] as MComparator; // GT, LT, or EQ
		const compareObject = input[compareKey] as object;

		const key = Object.keys(compareObject)[0];
		validateKeyMatchesKind(key, this.datasetKind);

		const mField: string = key.split("_")[1]; // MField
		const mValue = Object.values(compareObject)[0];

		this.data.getSections().forEach((section: any) => {
			if (compareKey === "GT" && section[mField] > mValue) {
				sectionMappings.add(section.uuid);
			} else if (compareKey === "LT" && section[mField] < mValue) {
				sectionMappings.add(section.uuid);
			} else if (compareKey === "EQ" && section[mField] === mValue) {
				sectionMappings.add(section.uuid);
			}
		});
		return sectionMappings;
	}

	private handleLogicComparison(input: LogicComparison): Set<string> {
		const allMappings: Array<Set<string>> = [];
		const logicKey = Object.keys(input)[0] as Logic;

		input[logicKey]?.forEach((comparison) => {
			allMappings.push(this.handleWhere(comparison));
		});

		const result = new Set<string>();
		if (logicKey === "AND") {
			// Initialize result with elements from the first set
			allMappings[0]?.forEach((uuid) => result.add(uuid));

			// Iterate over the remaining sets and filter out elements not common to all sets
			for (let i = 1; i < allMappings.length; i++) {
				const currentSet = allMappings[i];
				for (const uuid of result) {
					if (!currentSet.has(uuid)) {
						result.delete(uuid);
					}
				}
			}
		} else {
			// For OR logic, add all unique elements from all sets
			allMappings.forEach((mapping) => {
				mapping.forEach((uuid) => {
					result.add(uuid);
				});
			});
		}
		return result;
	}

	private handleOptions(selectedSections: any[]): InsightResult[] {
		if (selectedSections.length > 5000) {
			throw new ResultTooLargeError("Greater than 5000 results");
		}

		// Handle order
		if (this.OPTIONS.ORDER) {
			if (typeof this.OPTIONS.ORDER === "string") {
				orderSectionsByString(selectedSections, this.OPTIONS.ORDER, this.datasetKind);
			} else {
				orderSectionsBySortObject(selectedSections, this.OPTIONS.ORDER, this.datasetKind);
			}
		}

		// Return insightResults
		const result: InsightResult[] = selectedSections.map((section) => {
			// Only keep the fields listed in this.OPTIONS.COLUMNS
			const insight: Partial<InsightResult> = {};
			this.OPTIONS.COLUMNS.forEach((column) => {
				let key: string = column;
				if (column.includes("_")) {
					validateKeyMatchesKind(key, this.datasetKind);
					key = column.split("_")[1]; // if the column is like 'sections_avg'
				}
				insight[column] = section[key];
			});
			return insight as InsightResult; // forcibly cast the Partial<InsightResult> to InsightResult
		});
		return result;
	}
}
