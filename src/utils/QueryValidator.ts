import {InsightError} from "../controller/IInsightFacade";
import {
	Logic,
	LogicComparison,
	SComparison,
	MComparison,
	MComparator,
	SComparator,
	Negation,
	JSONQuery,
    ApplyRule,
    ApplyToken,
} from "../models/IQuery";

export default class QueryValidator {
	private dataset: string;
	private keys: Set<string>;

	constructor() {
		this.dataset = "";
		this.keys = new Set();
	}

	public validateQuery(query: object): string {
		this.validateQueryOutside(query);
		const vQuery = query as JSONQuery;
		if (Object.keys(vQuery.WHERE as object).length !== 0) {
			this.validateWhere(vQuery.WHERE as object);
		}
		if ("TRANSFORMATIONS" in vQuery) {
			this.validateTransformations(vQuery.TRANSFORMATIONS as object);
		}

		this.validateOptions(vQuery.OPTIONS);
		return this.dataset;
	}

	public validateQueryOutside(query: object) {
		const keys = Object.keys(query);
		if (keys.length > 2) {
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

	public validateOptions(options: object): void {
		const keys = Object.keys(options);
		if (keys.length > 2) {
			throw new InsightError("Excess Keys in Options");
		}

		// Check that options has COLUMNS
		if (!("COLUMNS" in options)) {
			throw new InsightError("Options missing COLUMNS");
		}

		// Check columns is nonempty array
		if (!Array.isArray(options.COLUMNS) || options.COLUMNS.length === 0) {
			throw new InsightError("COLUMNS must be non-empty array");
		}

		// Check for invalid keys
		for (const key of keys) {
			if (key !== "COLUMNS" && key !== "ORDER") {
				throw new InsightError("Options contains invalid keys");
			}
		}

		// Check type of Order if present
		if ("ORDER" in options) {
			if (options.ORDER && typeof options.ORDER === "object") {
				if (!("dir" in options.ORDER) || !("keys" in options.ORDER)) {
					throw new InsightError("Invalid Order structure");
				}
				// Additional validation can be added for 'dir' and 'keys'
			} else if (typeof options.ORDER !== "string") {
				throw new InsightError("Invalid Order type. Must be string or object.");
			}
		}

		// Validate keys in columns
		const allColumnKeys: string[] = [];
		options.COLUMNS.forEach((columnKey: string) => {
			if (!this.validateKey(columnKey)) {
				throw new InsightError(`Invalid key: ${columnKey}`);
			}
			allColumnKeys.push(columnKey);
		});

		// Validate key for order
		if ("ORDER" in options) {
			if (!this.validateKey(options.ORDER as string)) {
				throw new InsightError(`Invalid key: ${options.ORDER}`);
			}
			if (!allColumnKeys.includes(options.ORDER as string)) {
				throw new InsightError("Order key not in column keys");
			}
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

		if (!transformations.GROUP.every((key) => typeof key === "string")) {
			throw new InsightError("All elements in GROUP must be strings");
		}

		for (let key of transformations.GROUP) {
			if (!this.validateKey(key)) {
				throw new InsightError("Invalid key in GROUP: " + key);
			}
		}

		for (let rule of transformations.APPLY) {
			this.validateApplyRule(rule);
		}
	}

	public validateApplyRule(rule: ApplyRule): void {
		if (Object.keys(rule).length > 1) {
			throw new InsightError(`Apply rule should only have 1 key, has ${Object.keys(rule).length}`);
		}

		const applyKey = Object.keys(rule)[0];
		if (!this.validateApplyKey(applyKey)) {
			throw new InsightError("Cannot have underscore in applyKey");
		}

        if (this.keys.has(applyKey)) {
            throw new InsightError(`Duplicate APPLY key ${applyKey}`)
        }
        this.keys.add(applyKey);

		const applyValue = rule[applyKey];

		if (typeof applyValue !== "object") {
			throw new InsightError("Apply body must be object");
		}

		if (Object.keys(applyValue).length !== 1) {
			throw new InsightError(`Apply body should only have 1 key, has ${Object.keys(applyValue).length}`);
		}

		//Check for valid transformation operators
		const token: ApplyToken = Object.keys(applyValue)[0] as ApplyToken;
		const validTokens = ["MAX", "MIN", "AVG", "COUNT", "SUM"];
		if (!validTokens.includes(token)) {
			throw new InsightError("Invalid transformation operator");
		}

		if (typeof applyValue[token] !== "string") {
			throw new InsightError("Invalid apply rule target key");
		}

		if (!this.validateKey(applyValue[token])) {
			throw new InsightError(`Invalid key: ${applyValue[token]}`);
		}
	}

	private validateApplyKey(applyKey: string): boolean {
		const pattern = /^[^_]+$/;
		return pattern.test(applyKey);
	}

	public validateWhere(where: object): void {
		const keys = Object.keys(where);
		if (keys.length !== 1) {
			throw new InsightError("Nested Filter must contain 1 key");
		}

		// Check that key is one of the valid keys
		const key = keys[0];
		const validKeys = ["AND", "OR", "LT", "GT", "EQ", "IS", "NOT"];
		if (!validKeys.includes(key)) {
			throw new InsightError("Invalid key in WHERE");
		}

		if (key === "AND" || key === "OR") {
			this.validateLogicComparison(where);
		} else if (key === "IS") {
			this.validateSComparison(where);
		} else if (["LT", "GT", "EQ"].includes(key)) {
			this.validateMComparison(where);
		} else if (key === "NOT") {
			this.validateNot(where);
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
		if (!notObject.NOT || typeof notObject.NOT !== "object" || Array.isArray(notObject.NOT)) {
			throw new InsightError("NOT value must be object");
		}
		this.validateWhere(notObject.NOT);
	}

	public validateMComparison(object: object): void {
		const mComparison = object as MComparison;
		const mComparatorKeys = Object.keys(mComparison);
		const comparator = mComparatorKeys[0] as MComparator;

		const fieldObject = mComparison[comparator];
		if (typeof fieldObject !== "object" || Array.isArray(fieldObject)) {
			throw new InsightError(`MComparison for ${comparator} has invalid type`);
		}

		const fieldKeys = Object.keys(fieldObject);
		if (fieldKeys.length !== 1) {
			throw new InsightError(`${comparator} must have exactly one key`);
		}

		if (!this.validateMKey(fieldKeys[0])) {
			throw new InsightError(`Invalid key: ${fieldKeys[0]}`);
		}

		const fieldValue = fieldObject[fieldKeys[0]];
		if (typeof fieldValue !== "number") {
			throw new InsightError(`Invalid value for ${fieldKeys[0]} in MComparison. Expected a number`);
		}
	}

	public validateSComparison(object: object): void {
		const sComparison = object as SComparison;
		const mComparatorKeys = Object.keys(sComparison);
		const comparator = mComparatorKeys[0] as SComparator;

		const fieldObject = sComparison[comparator];
		if (typeof fieldObject !== "object" || Array.isArray(fieldObject)) {
			throw new InsightError(`SComparison for ${comparator} has invalid type`);
		}

		const fieldKeys = Object.keys(fieldObject);
		if (fieldKeys.length !== 1) {
			throw new InsightError(`${comparator} must have exactly one key`);
		}

		if (!this.validateSKey(fieldKeys[0])) {
			throw new InsightError(`Invalid key: ${fieldKeys[0]}`);
		}

		const fieldValue = fieldObject[fieldKeys[0]];
		if (typeof fieldValue !== "string") {
			throw new InsightError(`Invalid value for ${fieldKeys[0]} in SComparison. Expected a string`);
		}

		this.validateWildcardUsage(fieldValue);
	}

	private validateWildcardUsage(value: string): void {
		const startsWithAsterisk = value.startsWith("*");
		const endsWithAsterisk = value.endsWith("*");
		const asteriskCount = (value.match(/\*/g) || []).length;

		if (
			asteriskCount > 2 ||
			(asteriskCount === 1 && !startsWithAsterisk && !endsWithAsterisk) ||
			(asteriskCount === 2 && (!startsWithAsterisk || !endsWithAsterisk))
		) {
			throw new InsightError(
				"Invalid usage of wildcards in string. A valid string" +
					" can only start with or end with an asterisk, or both."
			);
		}
	}

	public validateMKey(input: string): boolean {
		const mKeyPattern = /^[^_]+_(avg|pass|fail|audit|year|lat|lon|seats)$/;
		if (!mKeyPattern.test(input)) {
			return false;
		}

		this.checkForMultipleDataset(input);
		return true;
	}

	public validateSKey(input: string): boolean {
		const sKeyPattern =
			/^[^_]+_(dept|id|instructor|title|uuid|fullname|shortname|number|name|address|type|furniture|href)$/;
		if (!sKeyPattern.test(input)) {
			return false;
		}
		this.checkForMultipleDataset(input);
		return true;
	}

	private checkForMultipleDataset(input: string) {
		const [contentName, key] = input.split("_");
		if (this.dataset === "") {
			this.dataset = contentName;
		} else if (this.dataset !== contentName) {
			throw new InsightError("Cannot query from multiple datasets");
		}
		this.keys.add(key);
	}

	public validateKey(input: string | undefined): boolean {
        if (typeof input === 'undefined') {
            return false;
        }
		if (!this.validateMKey(input) && !this.validateSKey(input) && !this.keys.has(input.split("_")[1])) {
			return false;
		}

		this.checkForMultipleDataset(input);
		return true;
	}
}
