import {InsightDatasetKind, InsightError, InsightResult, ResultTooLargeError} from "../controller/IInsightFacade";
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
	SField,
	Transformations,
} from "./IQuery";
import * as fs from "fs-extra";
import QueryValidator from "./QueryValidator";
import Sections, {Section} from "../models/Sections";
import {orderEntriesBySortObject, orderEntriesByString, validateKeyMatchesKind} from "../utils/SortUtils";
import Rooms, {Room} from "../models/Rooms";
import {Dataset} from "../models/Dataset";
import {handleTransformations} from "../utils/TransformUtils";

export class Query implements IQuery {
	public WHERE: Filter;
	public OPTIONS: Options;
	public TRANSFORMATIONS?: Transformations;
	public datasetName: string;

	private directory = "./data";
	private data: Dataset | undefined;

	constructor(queryJSON: JSONQuery) {
		let QV: QueryValidator = new QueryValidator();
		this.datasetName = QV.validateQuery(queryJSON);
		this.WHERE = queryJSON.WHERE;
		this.OPTIONS = queryJSON.OPTIONS;
		this.TRANSFORMATIONS = queryJSON.TRANSFORMATIONS;
		this.data = undefined;
	}

	/**
	 * Executes the current query against the stored dataset.
	 * @returns {InsightResult[]} The results of the executed query.
	 */
	public execute(): InsightResult[] {
		// Check if dataset file exists
		if (!fs.pathExistsSync(this.directory + "/" + this.datasetName + ".json")) {
			throw new InsightError(`Cannot query from ${this.datasetName} due to not being added yet.`);
		}

		// Load dataset from file
		this.loadData();

		// Evaluate WHERE clause of the query and get matching entries
		const afterWhere = this.handleWhere(this.WHERE);
		const selectedEntries: Section[] | Room[] = [];
		const allEntries = this.data?.getDataAsMap();

		// Populate selectedEntries with entries that match the WHERE clause
		afterWhere.forEach((uniqueID) => {
			const entry = allEntries?.get(uniqueID);
			selectedEntries.push(entry);
		});

		// Apply transformations, if any, and then handle options (e.g., sort, limit)
		const afterTransform = handleTransformations(selectedEntries, this.TRANSFORMATIONS, this.data?.getKind());
		return this.handleOptions(afterTransform);
	}

	/**
	 * Loads the dataset from the filesystem.
	 * Sets the internal data attribute based on dataset kind.
	 */
	private loadData() {
		// Read dataset from file
		const object = fs.readJSONSync(this.directory + "/" + this.datasetName + ".json");

		// Determine the dataset kind and initialize accordingly
		if (object.kind === InsightDatasetKind.Sections) {
			this.data = new Sections(object.id);
		} else {
			this.data = new Rooms(object.id);
		}

		// Add the data to the dataset object
		this.data?.addDataFromJSON(object.sections);
	}

	/**
	 * Evaluates the WHERE clause of the query.
	 * @param {Filter} input - The filter object from the WHERE clause.
	 * @returns {Set<string>} A set of unique IDs of entries that satisfy the WHERE clause.
	 */
	private handleWhere(input: Filter): Set<string> {
		if ("AND" in input || "OR" in input) {
			return this.handleLogicComparison(input as LogicComparison);
		} else if ("LT" in input || "GT" in input || "EQ" in input) {
			return this.handleMComparison(input as MComparison);
		} else if ("IS" in input) {
			return this.handleSComparison(input as SComparison);
		} else if ("NOT" in input) {
			return this.handleNegation(input as Negation);
		} else {
			// If no specific comparison is found, include all entries
			const all = new Set<string>();
			this.data?.getData().forEach((entry) => {
				all.add(this.data?.getKind() === InsightDatasetKind.Sections ? entry.uuid : entry.href);
			});
			return all;
		}
	}

	/**
	 * Evaluates the NOT filter in the WHERE clause.
	 * @param {Negation} input - Negation filter to be evaluated.
	 * @returns {Set<string>} Set of unique IDs of entries that satisfy the NOT filter.
	 */
	private handleNegation(input: Negation): Set<string> {
		// Handle the inner filter of the NOT clause
		const innerResult = this.handleWhere(input.NOT);

		// Compute the result of the NOT filter
		const negationResult = new Set<string>();
		this.data?.getData().forEach((entry) => {
			if (!innerResult.has(this.data?.getKind() === InsightDatasetKind.Sections ? entry.uuid : entry.href)) {
				negationResult.add(this.data?.getKind() === InsightDatasetKind.Sections ? entry.uuid : entry.href);
			}
		});

		return negationResult;
	}

	/**
	 * Evaluates the string comparison in the WHERE clause.
	 * @param {SComparison} input - String comparison filter to be evaluated.
	 * @returns {Set<string>} Set of unique IDs of entries that match the string comparison.
	 */
	private handleSComparison(input: SComparison): Set<string> {
		const sectionMappings = new Set<string>();
		const key = Object.keys(input.IS)[0]; // Dataset name + SField
		validateKeyMatchesKind(key, this.data?.getKind());
		const sField = key.split("_")[1] as SField; // SField
		const sValue = input.IS[key];

		// Check different string match conditions
		this.data?.getData().forEach((entry: any) => {
			if (sValue === "*") {
				// single asterik
				sectionMappings.add(this.data?.getKind() === InsightDatasetKind.Sections ? entry.uuid : entry.href);
			} else if (sValue.startsWith("*") && sValue.endsWith("*")) {
				// Contains inputstring
				if (entry[sField].includes(sValue.substring(1, sValue.length - 1))) {
					sectionMappings.add(this.data?.getKind() === InsightDatasetKind.Sections ? entry.uuid : entry.href);
				}
			} else if (sValue.startsWith("*")) {
				// Ends with inputstring
				if (entry[sField].endsWith(sValue.substring(1))) {
					sectionMappings.add(this.data?.getKind() === InsightDatasetKind.Sections ? entry.uuid : entry.href);
				}
			} else if (sValue.endsWith("*")) {
				// Starts with inputstring
				if (entry[sField].startsWith(sValue.substring(0, sValue.length - 1))) {
					sectionMappings.add(this.data?.getKind() === InsightDatasetKind.Sections ? entry.uuid : entry.href);
				}
			} else {
				// Matches inputstring exactly
				if (entry[sField] === sValue) {
					sectionMappings.add(this.data?.getKind() === InsightDatasetKind.Sections ? entry.uuid : entry.href);
				}
			}
		});
		return sectionMappings;
	}

	/**
	 * Evaluates the numeric comparison in the WHERE clause.
	 * @param {MComparison} input - Numeric comparison filter to be evaluated.
	 * @returns {Set<string>} Set of unique IDs of entries that match the numeric comparison.
	 */
	private handleMComparison(input: MComparison): Set<string> {
		const sectionMappings = new Set<string>();
		const compareKey: keyof MComparison = Object.keys(input)[0] as MComparator; // GT, LT, or EQ
		const compareObject = input[compareKey] as object;

		const key = Object.keys(compareObject)[0];
		validateKeyMatchesKind(key, this.data?.getKind());

		const mField: string = key.split("_")[1]; // MField
		const mValue = Object.values(compareObject)[0];

		this.data?.getData().forEach((entry: any) => {
			if (compareKey === "GT" && entry[mField] > mValue) {
				sectionMappings.add(this.data?.getKind() === InsightDatasetKind.Sections ? entry.uuid : entry.href);
			} else if (compareKey === "LT" && entry[mField] < mValue) {
				sectionMappings.add(this.data?.getKind() === InsightDatasetKind.Sections ? entry.uuid : entry.href);
			} else if (compareKey === "EQ" && entry[mField] === mValue) {
				sectionMappings.add(this.data?.getKind() === InsightDatasetKind.Sections ? entry.uuid : entry.href);
			}
		});
		return sectionMappings;
	}

	/**
	 * Evaluates the logical comparison in the WHERE clause.
	 * @param {LogicComparison} input - Logical comparison filter (AND/OR) to be evaluated.
	 * @returns {Set<string>} Set of unique IDs of entries that match the logical comparison.
	 */
	private handleLogicComparison(input: LogicComparison): Set<string> {
		const allMappings: Array<Set<string>> = [];
		const logicKey = Object.keys(input)[0] as Logic;

		input[logicKey]?.forEach((comparison) => {
			allMappings.push(this.handleWhere(comparison));
		});

		const result = new Set<string>();
		// Check the logical key (AND/OR) and aggregate results
		if (logicKey === "AND") {
			// Initialize result with elements from the first set
			allMappings[0]?.forEach((uniqueIdentifier) => result.add(uniqueIdentifier));

			// Iterate over the remaining sets and filter out elements not common to all sets
			for (let i = 1; i < allMappings.length; i++) {
				const currentSet = allMappings[i];
				for (const uniqueIdentifier of result) {
					if (!currentSet.has(uniqueIdentifier)) {
						result.delete(uniqueIdentifier);
					}
				}
			}
		} else {
			// For OR logic, add all unique elements from all sets
			allMappings.forEach((mapping) => {
				mapping.forEach((uniqueIdentifier) => {
					result.add(uniqueIdentifier);
				});
			});
		}
		return result;
	}

	/**
	 * Handles options like ordering and selecting specific columns.
	 * @param {any[]} selectedEntries - Array of selected dataset entries.
	 * @returns {InsightResult[]} Array of processed entries based on provided options.
	 */
	private handleOptions(selectedEntries: any[]): InsightResult[] {
		if (selectedEntries.length > 5000) {
			throw new ResultTooLargeError("Greater than 5000 results");
		}

		// Handle order
		if (this.OPTIONS.ORDER) {
			if (typeof this.OPTIONS.ORDER === "string") {
				orderEntriesByString(selectedEntries, this.OPTIONS.ORDER, this.data?.getKind());
			} else {
				orderEntriesBySortObject(selectedEntries, this.OPTIONS.ORDER, this.data?.getKind());
			}
		}

		// Create final result based on selected columns
		const result: InsightResult[] = selectedEntries.map((entry) => {
			// Map columns from options to final result
			const insight: Partial<InsightResult> = {};
			this.OPTIONS.COLUMNS.forEach((column) => {
				let key: string = column;
				if (column.includes("_")) {
					validateKeyMatchesKind(key, this.data?.getKind());
					key = column.split("_")[1]; // if the column is like 'sections_avg'
				}
				insight[column] = entry[key];
			});
			return insight as InsightResult; // forcibly cast the Partial<InsightResult> to InsightResult
		});
		return result;
	}
}
