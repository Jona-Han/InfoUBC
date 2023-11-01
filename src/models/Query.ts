import {InsightError, InsightResult, ResultTooLargeError} from "../controller/IInsightFacade";
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
import QueryValidator from "../utils/QueryValidator";
import Sections, {Section} from "./Sections";
import {Room} from "./Rooms";
import Decimal from "decimal.js";

export class Query implements IQuery {
	public WHERE: Filter;
	public OPTIONS: Options;
	public TRANSFORMATIONS: Transformations | undefined;
	public datasetName: string;

	private directory = "./data";
	private data: Sections;
	private datasetToFileMappings = {
		uuid: "id",
		id: "Course",
		title: "Title",
		instructor: "Professor",
		dept: "Subject",
		year: "Year",
		avg: "Avg",
		pass: "Pass",
		fail: "Fail",
		audit: "Audit",
	};

	private SectionFields = ["avg", "pass", "fail", "audit", "year", "dept", "id", "instructor", "title", "uuid"];
	private RoomFields = [
		"lat",
		"lon",
		"seats",
		"fullname",
		"shortname",
		"number",
		"name",
		"address",
		"type",
		"furniture",
		"href",
	];

	constructor(queryJSON: JSONQuery) {
		let QV: QueryValidator = new QueryValidator();
		this.datasetName = QV.validateQuery(queryJSON);
		this.WHERE = queryJSON.WHERE;
		this.OPTIONS = queryJSON.OPTIONS;
		this.TRANSFORMATIONS = queryJSON.TRANSFORMATIONS;
		this.data = new Sections(this.datasetName);
	}

	public execute(): InsightResult[] {
		if (!fs.pathExistsSync(this.directory + "/" + this.datasetName + ".json")) {
			throw new InsightError(`Cannot query from ${this.datasetName} due to not being added yet.`);
		}
		this.loadData();
		const afterWhere = this.handleWhere(this.WHERE);
		const afterTransform = this.handleTransformations(afterWhere);
		return this.handleOptions(afterWhere);
	}

	private loadData() {
		const object = fs.readJSONSync(this.directory + "/" + this.datasetName + ".json");
		this.data.addSections(object.sections);
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
				all.add(section.id);
			});
			return all;
		}
	}

	private handleTransformations(input: Set<string>) {
		if (this.TRANSFORMATIONS) {
			const groupings = this.handleGrouping(input);

			return this.handleApply(groupings);
		}
	}

	private handleApply(input: Map<string, Section[]>): Map<string, any> {
		const results = new Map<string, any>();

		for (const [tuple, sections] of input.entries()) {
			const result: any = {};

			this.TRANSFORMATIONS!.APPLY.forEach((applyRule) => {
				const applyKey = Object.keys(applyRule)[0];
				const applyToken = Object.keys(applyRule[applyKey])[0] as ApplyToken;
				const field = applyRule[applyKey][applyToken]?.split("_")[1];

				switch (applyToken) {
					case "MAX":
						result[applyKey] = Math.max(
							...sections.map(
								(section) =>
									section[
										this.datasetToFileMappings[field as MField | SField] as keyof Section
									] as number
							)
						);
						break;

					case "MIN":
						result[applyKey] = Math.min(
							...sections.map(
								(section) =>
									section[
										this.datasetToFileMappings[field as MField | SField] as keyof Section
									] as number
							)
						);
						break;

					case "AVG":
						let total = new Decimal(0);
						sections.forEach((section) => {
							total = total.add(
								new Decimal(
									section[
										this.datasetToFileMappings[field as MField | SField] as keyof Section
									] as number
								)
							);
						});
						let avg = total.toNumber() / sections.length;
						result[applyKey] = Number(avg.toFixed(2));
						break;

					case "SUM":
						let sum = sections.reduce((acc, section) => {
							const sumDecimal = new Decimal(acc).add(
								new Decimal(
									section[
										this.datasetToFileMappings[field as MField | SField] as keyof Section
									] as number
								)
							);
							return sumDecimal.toNumber();
						}, 0);
						result[applyKey] = Number(sum.toFixed(2));
						break;

					case "COUNT":
						const uniqueValues = new Set(
							sections.map(
								(section) =>
									section[
										this.datasetToFileMappings[field as MField | SField] as keyof Section
									] as number
							)
						);
						result[applyKey] = uniqueValues.size;
						break;
				}
			});
			const orderTuples = tuple.split("||");
            orderTuples.map((tuple) => {
                const [key, value] = tuple.split("__")
                result[key] = value;
            })

			results.set(tuple, result);
		};

		return results;
	}

	private handleGrouping(input: Set<string>) {
		const allSections = this.data.getSectionsAsMap();
		const selectedSections: Section[] = [];
		input.forEach((uuid) => {
			const section = allSections.get(uuid);
			if (section) {
				selectedSections.push(section);
			}
		});

		const groupings = new Map<string, Section[]>();

		selectedSections.forEach((section) => {
			const tuple = this.TRANSFORMATIONS!.GROUP.map(
				(key) =>
					`${key}__${
						section[this.datasetToFileMappings[key.split("_")[1] as MField | SField] as keyof Section]
					}`
			).join("||");

			if (!groupings.has(tuple)) {
				groupings.set(tuple, []);
			}

			groupings.get(tuple)!.push(section);
		});

		return groupings;
	}

	private handleNegation(input: Negation): Set<string> {
		// Handle the filter inside the NOT and get its result.
		const innerResult = this.handleWhere(input.NOT);

		// Subtract innerResult from allUUIDs to get the result of the NOT filter.
		const negationResult = new Set<string>();
		this.data.getSections().forEach((section) => {
			if (!innerResult.has(section.id)) {
				negationResult.add(section.id);
			}
		});

		return negationResult;
	}

	public handleSComparison(input: SComparison): Set<string> {
		const sectionMappings = new Set<string>();
		const key = Object.keys(input.IS)[0]; // Dataset name + SField
		const sField = this.datasetToFileMappings[key.split("_")[1] as SField]; // SField
		const sValue = input.IS[key];

		this.data.getSections().forEach((section: any) => {
			if (sValue.startsWith("*") && sValue.endsWith("*")) {
				// Contains inputstring
				if (section[sField].includes(sValue.substring(1, sValue.length - 1))) {
					sectionMappings.add(section.id);
				}
			} else if (sValue.startsWith("*")) {
				// Ends with inputstring
				if (section[sField].endsWith(sValue.substring(1))) {
					sectionMappings.add(section.id);
				}
			} else if (sValue.endsWith("*")) {
				// Starts with inputstring
				if (section[sField].startsWith(sValue.substring(0, sValue.length - 1))) {
					sectionMappings.add(section.id);
				}
			} else {
				// Matches inputstring exactly
				if (section[sField] === sValue) {
					sectionMappings.add(section.id);
				}
			}
		});
		return sectionMappings;
	}

	private handleMComparison(input: MComparison): Set<string> {
		const sectionMappings = new Set<string>();
		const compareKey: keyof MComparison = Object.keys(input)[0] as MComparator; // GT, LT, or EQ
		const compareObject = input[compareKey] as object;
		const datasetKey: string = Object.keys(compareObject)[0].split("_")[1]; // MField

		const mField = this.datasetToFileMappings[datasetKey as MField]; // MField but as a File key
		const mValue = Object.values(compareObject)[0];

		this.data.getSections().forEach((section: any) => {
			if (compareKey === "GT" && section[mField] > mValue) {
				sectionMappings.add(section.id);
			} else if (compareKey === "LT" && section[mField] < mValue) {
				sectionMappings.add(section.id);
			} else if (compareKey === "EQ" && section[mField] === mValue) {
				sectionMappings.add(section.id);
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

	private handleOptions(input: Set<string>): InsightResult[] {
		if (input.size > 5000) {
			throw new ResultTooLargeError("Greater than 5000 results");
		}

		// Get all sections and only add input sections to array
		const allSections = this.data.getSectionsAsMap();
		const selectedSections: Section[] = [];
		input.forEach((uuid) => {
			const section = allSections.get(uuid);
			if (section) {
				selectedSections.push(section);
			}
		});

		// Handle order
		if (this.OPTIONS.ORDER) {
			if (typeof this.OPTIONS.ORDER === "string") {
				this.orderSectionsByString(selectedSections);
			} else {
				this.orderSectionsBySortObject(selectedSections);
			}
		}

		// Return insightResults
		const result: InsightResult[] = selectedSections.map((section) => {
			// Only keep the fields listed in this.OPTIONS.COLUMNS
			const insight: Partial<InsightResult> = {};
			this.OPTIONS.COLUMNS.forEach((column) => {
				const key: string = column.split("_")[1]; // assuming the column field is like 'sections_avg'
				insight[column] = section[this.datasetToFileMappings[key as MField | SField] as keyof Section];
			});
			return insight as InsightResult; // forcibly cast the Partial<InsightResult> to InsightResult
		});
		return result;
	}

	private orderSectionsByString(selectedSections: Section[]): void {
		const orderString = this.OPTIONS.ORDER as string;
		const datasetKey = orderString.split("_")[1];

		let orderKey: keyof Section;

		if (this.SectionFields.includes(datasetKey)) {
			orderKey = this.datasetToFileMappings[datasetKey as MField | SField] as keyof Section;
		} else if (this.RoomFields.includes(datasetKey)) {
			orderKey = datasetKey as keyof Section;
		}

		selectedSections.sort((a, b) => {
			if (a[orderKey] < b[orderKey]) {
				return -1;
			} else if (a[orderKey] > b[orderKey]) {
				return 1;
			}
			return 0;
		});
	}

	private orderSectionsBySortObject(selectedSections: Section[] | Room[]): void {
		const orderObject = this.OPTIONS.ORDER as Sort;

		selectedSections.sort((a, b) => {
			for (let key of orderObject.keys) {
				if (this.SectionFields.includes(key)) {
					const orderKey = this.datasetToFileMappings[key as MField | SField] as keyof Section;

					// Using type assertion
					const aSection = a as Section;
					const bSection = b as Section;

					if (aSection[orderKey] < bSection[orderKey]) {
						return orderObject.dir === "UP" ? -1 : 1;
					} else if (aSection[orderKey] > bSection[orderKey]) {
						return orderObject.dir === "UP" ? 1 : -1;
					}
				} else if (this.RoomFields.includes(key)) {
					const orderKey = key as keyof Room;

					// Using type assertion
					const aRoom = a as Room;
					const bRoom = b as Room;

					if (aRoom[orderKey] < bRoom[orderKey]) {
						return orderObject.dir === "UP" ? -1 : 1;
					} else if (aRoom[orderKey] > bRoom[orderKey]) {
						return orderObject.dir === "UP" ? 1 : -1;
					}
				}
				// If equal, the loop will check the next key (tiebreaker)
			}
			return 0;
		});
	}
}
