import {InsightError} from "../controller/IInsightFacade";
import KeyValidator from "../utils/KeyValidator";
import {
	Logic,
	LogicComparison,
	SComparison,
	MComparison,
	MComparator,
	SComparator,
	Negation,
	JSONQuery,
} from "./IQuery";

export default class QueryValidator {
	private KV = new KeyValidator();

	public validateQuery(query: object): string {
		this.validateQueryOutside(query);
		const vQuery = query as JSONQuery;
		if ("TRANSFORMATIONS" in vQuery) {
			this.validateTransformations(vQuery.TRANSFORMATIONS as object);
		}

		if (Object.keys(vQuery.WHERE as object).length !== 0) {
			this.validateWhere(vQuery.WHERE as object);
		}

		this.validateOptions(vQuery.OPTIONS);
		return this.KV.getDatasetName();
	}

	public validateQueryOutside(query: object) {
		const keys = Object.keys(query);
		if (keys.length > 2 && !("TRANSFORMATIONS" in query)) {
			throw new InsightError("Excess Keys in Query");
		}

		if (!("WHERE" in query)) {
			throw new InsightError("Missing WHERE");
		}

		if (!("OPTIONS" in query)) {
			throw new InsightError("Missing OPTIONS");
		}

		if (typeof query.WHERE !== "object" || Array.isArray(query.WHERE)) {
			throw new InsightError("Invalid WHERE type");
		}

		if (typeof query.OPTIONS !== "object" || Array.isArray(query.OPTIONS)) {
			throw new InsightError("Invalid OPTIONS type");
		}
	}

	public validateWhere(where: object): void {
		const keys = Object.keys(where);
		if (keys.length !== 1) {
			throw new InsightError("Nested Filter must contain 1 key");
		}

		// Check that key is one of the valid keys
		const key = keys[0];
		if (key === "AND" || key === "OR") {
			this.validateLogicComparison(where);
		} else if (key === "IS") {
			this.validateSComparison(where);
		} else if (["LT", "GT", "EQ"].includes(key)) {
			this.validateMComparison(where);
		} else if (key === "NOT") {
			this.validateNot(where);
		} else {
			throw new InsightError("Invalid key in WHERE");
		}
	}

	public validateOptions(options: object): void {
		const keys = Object.keys(options);
		if (keys.length > 2) {
			throw new InsightError("Excess Keys in Options");
		}

		// Check that options has COLUMNS
		if (!("COLUMNS" in options)) {
			throw new InsightError("Options missing COLUMNS");
		}

        // Check for invalid keys
		for (const key of keys) {
			if (key !== "COLUMNS" && key !== "ORDER") {
				throw new InsightError("Options contains invalid keys");
			}
		}

		// Check columns is nonempty array
		if (!Array.isArray(options.COLUMNS) || options.COLUMNS.length === 0) {
			throw new InsightError("COLUMNS must be non-empty array");
		}
		if (!options.COLUMNS.every((key) => typeof key === "string")) {
			throw new InsightError("All elements in COLUMNS must be strings");
		}

		// Validate keys in columns
		const allColumnKeys: string[] = [];
		options.COLUMNS.forEach((columnKey: string) => {
			this.KV.validateColumnKey(columnKey);
			allColumnKeys.push(columnKey);
		});

		if ("ORDER" in options) {
			this.validateOrder(options.ORDER, allColumnKeys);
		}
	}

	public validateOrder(order: unknown, columnKeys: string[]) {
		if (typeof order === "string") {
			this.KV.validateOrderKey(order, columnKeys);
		} else if (typeof order === "object") {
			if (!order || !("dir" in order) || !("keys" in order)) {
				throw new InsightError("Invalid Order structure");
			}
			if (typeof order.dir !== "string" || !["DOWN", "UP"].includes(order.dir)) {
				throw new InsightError("Invalid ORDER direction.");
			}
            // Check if order.keys is an array
			if (!Array.isArray(order.keys) || order.keys.length === 0) {
				throw new InsightError("ORDER keys must be a non-empty array");
			}
            // Check if each element of order.keys is a string and is present in columnKeys
			for (const key of order.keys) {
				this.KV.validateOrderKey(key, columnKeys);
			}
		} else {
			throw new InsightError("Invalid Order type. Must be string or object.");
		}
	}

	public validateTransformations(transformations: object): void {
		if (!("GROUP" in transformations)) {
			throw new InsightError("TRANSFORMATIONS missing GROUP");
		}
		if (!("APPLY" in transformations)) {
			throw new InsightError("TRANSFORMATIONS missing APPLY");
		}
		if (!Array.isArray(transformations.GROUP)) {
			throw new InsightError("GROUP must be a non-empty array");
		}
		if (!Array.isArray(transformations.APPLY)) {
			throw new InsightError("APPLY must be a non-empty array");
		}
		if (!transformations.GROUP.every((key: any) => typeof key === "string")) {
			throw new InsightError("All elements in GROUP must be strings");
		}
		for (let key of transformations.GROUP) {
			if (!this.KV.validateGroupKey(key)) {
				throw new InsightError("Invalid key in GROUP: " + key);
			}
		}

		for (let rule of transformations.APPLY) {
			this.validateApplyRule(rule);
		}
	}

	public validateApplyRule(rule: any): void {
		if (Object.keys(rule).length > 1) {
			throw new InsightError(`Apply rule should only have 1 key, has ${Object.keys(rule).length}`);
		}

		const applyKey = Object.keys(rule)[0];
		this.KV.validateApplyKey(applyKey);
		const applyValue = rule[applyKey];

		if (typeof applyValue !== "object") {
			throw new InsightError("Apply body must be object");
		}
		if (Object.keys(applyValue).length !== 1) {
			throw new InsightError(`Apply body should only have 1 key, has ${Object.keys(applyValue).length}`);
		}

		// Check for valid transformation operators
		const token = Object.keys(applyValue)[0];
		const validTokens = ["MAX", "MIN", "AVG", "COUNT", "SUM"];
		if (!validTokens.includes(token)) {
			throw new InsightError("Invalid transformation operator");
		}
		if (typeof applyValue[token] !== "string") {
			throw new InsightError("Invalid apply rule target key");
		}
		if (!this.KV.validateApplyRuleTargetKey(applyValue[token])) {
			throw new InsightError(`Invalid key in ${token}: ${applyValue[token]}`);
		}
	}

	public validateLogicComparison(object: object): void {
		const logicComparison = object as LogicComparison;
		const logicComparatorKeys = Object.keys(logicComparison);
		const comparator = logicComparatorKeys[0] as Logic;

		const fieldObject = logicComparison[comparator];
		if (!Array.isArray(fieldObject) || fieldObject.length === 0) {
			throw new InsightError(`${comparator} should be non-empty array`);
		}

		for (const filter of fieldObject) {
			this.validateWhere(filter as object); // recursively validate each filter in the array
		}
	}

	public validateNot(object: object): void {
		const notObject = object as Negation;
		if (typeof notObject.NOT !== "object" || Array.isArray(notObject.NOT)) {
			throw new InsightError("NOT value must be object");
		}
		this.validateWhere(notObject.NOT as object);
	}

	public validateMComparison(object: object): void {
		const mComparison = object as MComparison;
		const mComparatorKeys = Object.keys(mComparison);
		const comparator = mComparatorKeys[0] as MComparator;

		const fieldObject = mComparison[comparator];
		if (typeof fieldObject !== "object" || Array.isArray(fieldObject)) {
			throw new InsightError(`${comparator} value has invalid type`);
		}

		const fieldKeys = Object.keys(fieldObject);
		if (fieldKeys.length !== 1) {
			throw new InsightError(`${comparator} must have exactly one key`);
		}

		if (!this.KV.validateMKey(fieldKeys[0])) {
			throw new InsightError(`Invalid key in ${comparator}: ${fieldKeys[0]}`);
		}

		const fieldValue = fieldObject[fieldKeys[0]];
		if (typeof fieldValue !== "number") {
			throw new InsightError(`Invalid value for ${fieldKeys[0]} in MComparison. Expected a number`);
		}
	}

	public validateSComparison(object: object): void {
		const sComparison = object as SComparison;
		const comparator = Object.keys(sComparison)[0] as SComparator;

		const fieldObject = sComparison[comparator];
		if (typeof fieldObject !== "object" || Array.isArray(fieldObject)) {
			throw new InsightError(`SComparison for ${comparator} has invalid type`);
		}

		const fieldKeys = Object.keys(fieldObject);
		if (fieldKeys.length !== 1) {
			throw new InsightError(`${comparator} must have exactly one key`);
		}

		if (!this.KV.validateSKey(fieldKeys[0])) {
			throw new InsightError(`Invalid key in IS: ${fieldKeys[0]}`);
		}

		const fieldValue = fieldObject[fieldKeys[0]];
		if (typeof fieldValue !== "string") {
			throw new InsightError(`Invalid value type for ${fieldKeys[0]} in IS. Expected a string`);
		}

		this.validateWildcardUsage(fieldValue);
	}

	private validateWildcardUsage(value: string): void {
		const startsWithAsterisk = value.startsWith("*");
		const endsWithAsterisk = value.endsWith("*");
		const asteriskCount = (value.match(/\*/g) || []).length;

		if (
			asteriskCount > 2 || (asteriskCount === 1 && !startsWithAsterisk && !endsWithAsterisk) ||
			(asteriskCount === 2 && (!startsWithAsterisk || !endsWithAsterisk))
		) {
			throw new InsightError(
				"Invalid usage of wildcards in string. A valid string" +
					" can only start with or end with an asterisk, or both."
			);
		}
	}
}
