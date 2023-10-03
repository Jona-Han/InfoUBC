import {
	Logic,
	Filter,
	LogicComparison,
	SComparison,
	MComparison,
	MComparator,
	SComparator,
	Negation,
	Options,
	JSONQuery,
	QueryError,
} from "../models/IQuery";

function validateQueryOutside(query: object) {
	const keys = Object.keys(query);
	if (keys.length > 2) {
		throw new QueryError("Excess Keys in Query");
	}

	if (!("WHERE" in query)) {
		throw new QueryError("Missing WHERE");
	}

	if (!("OPTIONS" in query)) {
		throw new QueryError("Missing OPTIONS");
	}

	if (typeof query.WHERE !== "object" || Array.isArray(query.WHERE)) {
		throw new QueryError("Invalid WHERE type");
	}

	if (typeof query.OPTIONS !== "object" || Array.isArray(query.OPTIONS)) {
		throw new QueryError("Invalid OPTIONS type");
	}
}

function validateOptions(options: object): void {
	const keys = Object.keys(options);
	if (keys.length > 2) {
		throw new QueryError("Excess Keys in Options");
	}

	// Check that options has COLUMNS
	if (!("COLUMNS" in options)) {
		throw new QueryError("Options missing COLUMNS");
	}

	// Check columns is nonempty array
	if (!Array.isArray(options.COLUMNS) || options.COLUMNS.length === 0) {
		throw new QueryError("COLUMNS must be non-empty array");
	}

	// Check for invalid keys
	for (const key of keys) {
		if (key !== "COLUMNS" && key !== "ORDER") {
			throw new QueryError("Options contains invalid keys");
		}
	}

	// Check type of Order
	if ("ORDER" in options && typeof options.ORDER !== "string") {
		throw new QueryError("Invalid Order type. Must be string.");
	}
}

function validateWhere(where: object): void {
	const keys = Object.keys(where);
	if (keys.length !== 1) {
		throw new QueryError("WHERE must contain 1 key");
	}

	// Check that key is one of the valid keys
	const key = keys[0];
	const validKeys = ["AND", "OR", "LT", "GT", "EQ", "IS", "NOT"];
	if (!validKeys.includes(key)) {
		throw new QueryError("Invalid key in WHERE");
	}

	if (key === "AND" || key === "OR") {
		validateLogicComparison(where);
	} else if (key === "IS") {
		validateSComparison(where);
	} else if (["LT", "GT", "EQ"].includes(key)) {
		validateMComparison(where);
	} else if (key === "NOT") {
		validateNot(where);
	}
}

function validateNot(object: object): void {
	const notObject = object as Negation;
	if (!notObject.NOT || typeof notObject.NOT !== "object" || Array.isArray(notObject.NOT)) {
		throw new QueryError("NOT value must be object");
	}
	validateWhere(notObject.NOT);
}

function validateLogicComparison(object: object): void {
	const logicComparison = object as LogicComparison;
	const logicComparatorKeys = Object.keys(logicComparison);
	const comparator = logicComparatorKeys[0] as Logic;

	const fieldObject = logicComparison[comparator];
	if (!Array.isArray(fieldObject) || fieldObject.length === 0) {
		throw new QueryError(`${comparator} should be non-empty array`);
	}

	for (const filter of fieldObject) {
		validateWhere(filter as object); // recursively validate each filter in the array
	}
}

function validateMComparison(object: object): void {
	const mComparison = object as MComparison;
	const mComparatorKeys = Object.keys(mComparison);
	const comparator = mComparatorKeys[0] as MComparator;

	const fieldObject = mComparison[comparator];
	if (typeof fieldObject !== "object" || Array.isArray(fieldObject)) {
		throw new QueryError(`MComparison for ${comparator} has invalid type`);
	}

	const fieldKeys = Object.keys(fieldObject);
	if (fieldKeys.length !== 1) {
		throw new QueryError(`${comparator} must have exactly one key`);
	}

	const fieldValue = fieldObject[fieldKeys[0]];
	if (typeof fieldValue !== "number") {
		throw new QueryError(`Invalid value for ${fieldKeys[0]} in MComparison. Expected a number`);
	}
}

function validateSComparison(object: object): void {
	const sComparison = object as SComparison;
	const mComparatorKeys = Object.keys(sComparison);
	const comparator = mComparatorKeys[0] as SComparator;

	const fieldObject = sComparison[comparator];
	if (typeof fieldObject !== "object" || Array.isArray(fieldObject)) {
		throw new QueryError(`SComparison for ${comparator} has invalid type`);
	}

	const fieldKeys = Object.keys(fieldObject);
	if (fieldKeys.length !== 1) {
		throw new QueryError(`${comparator} must have exactly one key`);
	}

	const fieldValue = fieldObject[fieldKeys[0]];
	if (typeof fieldValue !== "string") {
		throw new QueryError(`Invalid value for ${fieldKeys[0]} in SComparison. Expected a string`);
	}
}

export {
	validateQueryOutside,
	validateWhere,
	validateLogicComparison,
	validateMComparison,
	validateSComparison,
	validateOptions,
	validateNot
};
