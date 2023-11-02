import Decimal from "decimal.js";
import {InsightDatasetKind} from "../controller/IInsightFacade";
import {ApplyRule, ApplyToken} from "../query/IQuery";
import {validateKeyMatchesKind} from "./SortUtils";

/**
 * Handles transformations applied to a dataset.
 * @param {any[]} input - Array of records to which transformations need to be applied.
 * @returns {any[]} Array of transformed records.
 */
export function handleTransformations(input: any[], transformation: any, kind: InsightDatasetKind | undefined): any[] {
	if (transformation && kind) {
		// Group data based on the provided grouping keys
		const groupings = handleGrouping(input, transformation, kind);

		// Apply transformations to the grouped data
		return handleApply(groupings, transformation, kind);
	}
	return input;
}

/**
 * Groups dataset entries based on provided grouping keys.
 * @param {any[]} selectedEntries - Array of records to be grouped.
 * @returns {Map<string, any[]>} Map of grouped records.
 */
function handleGrouping(selectedEntries: any[], transformation: any, kind: InsightDatasetKind): Map<string, any[]> {
	const groupings = new Map<string, any[]>();

	selectedEntries.forEach((entry) => {
		// Construct the group tuple using provided grouping keys
		const tuple = transformation.GROUP.map((key: string) => {
			validateKeyMatchesKind(key, kind);
			return `${key}__${entry[key.split("_")[1]]}`;
		}).join("||");

		// If tuple doesn't exist, initialize with an empty array
		if (!groupings.has(tuple as string)) {
			groupings.set(tuple as string, []);
		}

		// Add entry to the respective tuple group
		groupings.get(tuple as string)?.push(entry);
	});

	return groupings;
}

/**
 * Applies transformations to the grouped data.
 * @param {Map<string, any[]>} input - Map of grouped records.
 * @returns {any[]} Array of transformed records after applying rules.
 */
function handleApply(input: Map<string, any[]>, transformation: any, kind: InsightDatasetKind): any[] {
	const results: any[] = [];

	for (const [encodedTuple, sections] of input.entries()) {
		const result: any = {};
		// Apply transformation rules
		applyRules(sections, result, transformation.APPLY, kind);

		// Decode tuple and populate result
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

/**
 * Applies the provided rules on the sections and populates the result object.
 * @param {any[]} sections - The array of sections to apply the rules on.
 * @param {any} result - The result object to populate.
 * @param {ApplyRule[] | undefined} rules - The array of rules to apply.
 * @param {InsightDatasetKind | undefined} kind - The kind of dataset being considered.
 */
export function applyRules(
	sections: any[],
	result: any,
	rules: ApplyRule[] | undefined,
	kind: InsightDatasetKind | undefined
): void {
	if (rules !== undefined) {
		rules.forEach((applyRule) => {
			const applyKey = Object.keys(applyRule)[0];
			const applyToken = Object.keys(applyRule[applyKey])[0] as ApplyToken;
			validateKeyMatchesKind(applyRule[applyKey][applyToken], kind);
			const field = applyRule[applyKey][applyToken]?.split("_")[1];

			// Apply the rule based on its token
			switch (applyToken) {
				case "MAX": {
					result[applyKey] = Math.max(...sections.map((entry) => entry[field as string] as number));
					break;
				}
				case "MIN": {
					result[applyKey] = Math.min(...sections.map((entry) => entry[field as string] as number));
					break;
				}
				case "AVG": {
					let total = new Decimal(0);
					sections.forEach((entry) => (total = total.add(new Decimal(entry[field as string] as number))));
					result[applyKey] = Number((total.toNumber() / sections.length).toFixed(2));
					break;
				}
				case "SUM": {
					const sum = sections.reduce(
						(acc, entry) => new Decimal(acc).add(new Decimal(entry[field as string] as number)).toNumber(),
						0
					);
					result[applyKey] = Number(sum.toFixed(2));
					break;
				}
				case "COUNT": {
					result[applyKey] = new Set(sections.map((entry) => entry[field as string])).size;
					break;
				}
			}
		});
	}
}
