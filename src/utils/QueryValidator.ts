import {
	Logic,
	Filter,
	LogicComparison,
	SComparison,
	MComparison,
	MComparator,
	Negation,
	Options,
	JSONQuery,
	QueryError,
} from "../models/IQuery";

function validateQuery(query: Object) {
	const keys = Object.keys(query);
	if (keys.length !== 2) {
		throw new QueryError("Excess Keys in Query");
	}

	if (!("WHERE" in query)) {
		throw new QueryError("Missing WHERE");
	}

	if (!("OPTIONS" in query)) {
		throw new QueryError("Missing OPTIONS");
	}
}

function validateWhere(filter: Filter): void {
	if (!filter) {
		return;
	}

	const filterKeys = Object.keys(filter);

	if (filterKeys.length !== 1) {
		throw new QueryError("Each filter should be composed of exactly one key");
	}

	const key = filterKeys[0];
	if (key === "AND" || key === "OR") {
		validateLogicComparison(filter as LogicComparison);
	} else if (key === "IS") {
		validateSComparison(filter as SComparison);
	} else if (["LT", "GT", "EQ"].includes(key)) {
		validateMComparison(filter as MComparison);
	} else if (key === "NOT") {
		validateNot(filter as Negation);
	} else {
		throw new QueryError(`Invalid key in filter: ${key}`);
	}
}

function validateLogicComparison(logicComparison: LogicComparison): void {
	const logicKeys = Object.keys(logicComparison);
	const filterArray = logicComparison[logicKeys[0] as Logic];

	if (!Array.isArray(filterArray) || filterArray.length === 0) {
		throw new QueryError(`LogicComparison for ${logicKeys[0]} must have a non-empty array of filters`);
	}

	for (const filter of filterArray) {
		validateWhere(filter); // recursively validate each filter in the array
	}
}

function validateMComparison(mComparison: MComparison): void {
	const mComparatorKeys = Object.keys(mComparison);
	const comparator = mComparatorKeys[0] as MComparator;

	// todo: Check that doesn't map to an array

	const fieldObject = mComparison[comparator];
	if (!fieldObject) {
		throw new QueryError(`MComparison for ${comparator} must have a value`);
	}

	const fieldKeys = Object.keys(fieldObject);
	if (fieldKeys.length !== 1) {
		throw new QueryError("MComparison value object must have exactly one key");
	}

	const fieldValue = fieldObject[fieldKeys[0]];
	if (typeof fieldValue !== "number") {
		throw new QueryError(`Invalid value for ${fieldKeys[0]} in MComparison. Expected a number`);
	}
}

function validateSComparison(sComparison: SComparison): void {
	// Check that IS maps to an object
	const isObject = sComparison.IS;
	if (!isObject) {
		throw new QueryError("SComparison must have a value");
	}
	// todo: Check that IS doesn't map to an array

	// Check that IS maps to an object with only 1 key
	const isKeys = Object.keys(isObject);
	if (isKeys.length !== 1) {
		throw new QueryError("IS object in SComparison must have exactly one key");
	}

	// Check that skey maps to an input string
	const fieldKey = isKeys[0];
	const fieldValue = isObject[fieldKey];
	if (!fieldValue) {
		throw new QueryError("SComparison must have a skey to inputstring mapping");
	}

	// Check that the skey mapped value is a string
	if (typeof fieldValue !== "string") {
		throw new QueryError(`Invalid value for ${fieldKey} in SComparison. Expected a string`);
	}
}

function validateOptions(options: Options): void {
	if (!options.COLUMNS || !Array.isArray(options.COLUMNS) || options.COLUMNS.length === 0) {
		throw new QueryError("Invalid Options: Missing or empty COLUMNS array");
	}
	// Add further validation
}

function validateNot(notObject: Negation): void {}

export {
	validateQuery,
	validateWhere,
	validateLogicComparison,
	validateMComparison,
	validateSComparison,
	validateOptions,
};
