import {InsightError, InsightResult} from "../controller/IInsightFacade";
import {
	Filter,
	IQuery,
	JSONQuery,
	Logic,
	LogicComparison,
	MComparator,
	MComparison,
	Negation,
	Options,
	SComparison,
} from "./IQuery";
import * as fs from "fs-extra";
import QueryValidator from "../utils/QueryValidator";
import Dataset, {Section} from "./Dataset";

export class Query implements IQuery {
	public WHERE: Filter;
	public OPTIONS: Options;
	public datasetName: string;

	private directory = "./data";
	private data: Dataset;

	constructor(queryJSON: JSONQuery) {
		let QV: QueryValidator = new QueryValidator();
		this.datasetName = QV.validateQuery(queryJSON);
		this.WHERE = queryJSON.WHERE;
		this.OPTIONS = queryJSON.OPTIONS;
		this.data = new Dataset(this.datasetName);
	}

	public execute(): InsightResult[] {
		if (!fs.pathExistsSync(this.directory + "/" + this.datasetName + ".json")) {
			throw new InsightError(`Cannot query from ${this.datasetName} due to not being added yet.`);
		}
		this.loadData();
		const afterWhere = this.handleWhere(this.WHERE);
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
			throw new InsightError("Invalid filter type after Query validated");
		}
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
		const key = Object.keys(input.IS)[0];
		const sField = key.split("_")[1];
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
		const compareKey = Object.keys(input)[0] as MComparator;
		const mField = Object.keys(input[compareKey])[0].split("_")[1];
		const mValue = input[compareKey][Object.keys(input[compareKey])[0]];

		this.data.getSections().forEach((section: any) => {
			if (compareKey === "GT" && section[mField] > mValue) {
				sectionMappings.add(section.uuid);
			} else if (compareKey === "LT" && section[mField] < mValue) {
				sectionMappings.add(section.uuid);
			} else if (section[mField] === mValue) {
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

    private handleOptions(input: Set<string>): InsightResult[] {
        throw new InsightError("Not implemented");
    }
}
