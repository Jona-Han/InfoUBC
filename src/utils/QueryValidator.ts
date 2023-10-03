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

function validateQueryOutside(query: Object) {
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

    if (typeof query.WHERE !== 'object' || Array.isArray(query.WHERE)) {
        throw new QueryError("Invalid WHERE type");
    }

    if (typeof query.OPTIONS !== 'object' || Array.isArray(query.OPTIONS)) {
        throw new QueryError("Invalid OPTIONS type");
    }
}

function validateOptions(options: Object): void {
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

function validateWhere(where: Object): void {
    const keys = Object.keys(where);
	if (keys.length !== 1) {
		throw new QueryError("Excess Keys in WHERE");
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

function validateLogicComparison(logicObject: LogicComparison): void {
    const keys = Object.keys(logicObject);

    if (keys.length !== 1) {
      throw new QueryError("LogicComparison must have exactly one key");
    }
  
    const key = keys[0] as Logic;
    
  
    if (!Array.isArray(logicObject[key]) || logicObject[key].length === 0) {
      throw new QueryError(`LogicComparison for ${key} must have a non-empty array of filters`);
    }
  
    for (const filter of logicObject[key]) {
      validateWhere(filter); // recursively validate each filter in the array
    }
}

function validateMComparison(mComparison: MComparison): void {
	const mComparatorKeys = Object.keys(mComparison);
	const comparator = mComparatorKeys[0] as MComparator;

	const fieldObject = mComparison[comparator];
    if (typeof fieldObject !== 'object' || Array.isArray(fieldObject)) {
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

function validateSComparison(isObject: Object): void {
	// Check that IS maps to an object
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
	const fieldValue;
	if (!fieldValue) {
		throw new QueryError("SComparison must have a skey to inputstring mapping");
	}

	// Check that the skey mapped value is a string
	if (typeof fieldValue !== "string") {
		throw new QueryError(`Invalid value for ${fieldKey} in SComparison. Expected a string`);
	}
}

function validateNot(notObject: Object): void {}

export {
	validateQueryOutside,
	validateWhere,
	validateLogicComparison,
	validateMComparison,
	validateSComparison,
	validateOptions,
};
