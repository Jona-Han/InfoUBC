import {QueryError} from "../../src/models/IQuery";

// Import necessary modules
import {expect} from "chai";
import {
	validateQueryOutside,
	validateOptions,
	validateMComparison,
	validateSComparison,
} from "../../src/utils/QueryValidator"; // Replace with the actual module path

describe("validateQuery", () => {
	it("should not throw an error for a valid query object", () => {
		const validQuery = {
			WHERE: {
				GT: {
					sections_avg: 97,
				},
			},
			OPTIONS: {
				COLUMNS: ["sections_dept"],
				ORDER: "sections_avg",
			},
		};

		expect(() => validateQueryOutside(validQuery)).to.not.throw();
	});

	it("should throw QueryError for excess keys in the query", () => {
		const invalidQuery = {
			WHERE: {
				GT: {
					sections_avg: 97,
				},
			},
			OPTIONS: {
				COLUMNS: ["sections_dept"],
				ORDER: "sections_avg",
			},
			EXTRA_KEY: "value", // Adding an extra key
		};

		expect(() => validateQueryOutside(invalidQuery)).to.throw(QueryError, "Excess Keys in Query");
	});

	it("should throw QueryError for missing WHERE", () => {
		const invalidQuery = {
			OPTIONS: {
				COLUMNS: ["sections_dept", "sections_avg"],
				ORDER: "sections_avg",
			},
		};

		expect(() => validateQueryOutside(invalidQuery)).to.throw(QueryError, "Missing WHERE");
	});

	it("should throw QueryError for missing OPTIONS", () => {
		const invalidQuery = {
			WHERE: {
				GT: {
					sections_avg: 97,
				},
			},
		};

		expect(() => validateQueryOutside(invalidQuery)).to.throw(QueryError, "Missing OPTIONS");
	});

	it("should throw QueryError for invalid WHERE type (string)", () => {
		const invalidQuery = {
			WHERE: "invalidType",
			OPTIONS: {
				COLUMNS: ["sections_dept", "sections_avg"],
				ORDER: "sections_avg",
			},
		};

		expect(() => validateQueryOutside(invalidQuery)).to.throw(QueryError, "Invalid WHERE type");
	});

	it("should throw QueryError for invalid WHERE type (array)", () => {
		const invalidQuery = {
			WHERE: [],
			OPTIONS: {
				COLUMNS: ["sections_dept", "sections_avg"],
				ORDER: "sections_avg",
			},
		};

		expect(() => validateQueryOutside(invalidQuery)).to.throw(QueryError, "Invalid WHERE type");
	});

	it("should throw QueryError for invalid OPTIONS type (string)", () => {
		const invalidQuery = {
			WHERE: {
				GT: {
					sections_avg: 97,
				},
			},
			OPTIONS: "invalidType",
		};

		expect(() => validateQueryOutside(invalidQuery)).to.throw(QueryError, "Invalid OPTIONS type");
	});

	it("should throw QueryError for invalid OPTIONS type (array)", () => {
		const invalidQuery = {
			WHERE: {
				GT: {
					sections_avg: 97,
				},
			},
			OPTIONS: [],
		};

		expect(() => validateQueryOutside(invalidQuery)).to.throw(QueryError, "Invalid OPTIONS type");
	});
});

describe("validateOptions", () => {
	it("should not throw an error for valid options", () => {
		const validOptions = {
			COLUMNS: ["col1", "col2"],
			ORDER: "col1",
		};

		expect(() => validateOptions(validOptions)).to.not.throw();
	});

	it("should throw QueryError for excess keys", () => {
		const invalidOptions = {
			COLUMNS: ["col1", "col2"],
			ORDER: "col1",
			EXTRA_KEY: "value", // Extra key
		};

		expect(() => validateOptions(invalidOptions)).to.throw(QueryError, "Excess Keys in Options");
	});

	it("should throw QueryError for missing COLUMNS", () => {
		const invalidOptions = {
			ORDER: "col1",
		};

		expect(() => validateOptions(invalidOptions)).to.throw(QueryError, "Options missing COLUMNS");
	});

	it("should throw QueryError for empty COLUMNS", () => {
		const invalidOptions = {
			COLUMNS: [],
			ORDER: "col1",
		};

		expect(() => validateOptions(invalidOptions)).to.throw(QueryError, "COLUMNS must be non-empty array");
	});

	it("should throw QueryError for invalid keys", () => {
		const invalidOptions = {
			COLUMNS: ["col1", "col2"],
			INVALID_KEY: "value", // Invalid key
		};

		expect(() => validateOptions(invalidOptions)).to.throw(QueryError, "Options contains invalid keys");
	});

	it("should throw QueryError for invalid ORDER type", () => {
		const invalidOptions = {
			COLUMNS: ["col1", "col2"],
			ORDER: 42, // Invalid type
		};

		expect(() => validateOptions(invalidOptions)).to.throw(QueryError, "Invalid Order type. Must be string.");
	});
});

describe("validateMComparison", () => {
	it("should not throw an error for valid MComparison", () => {
		const validMComparison = {
			LT: {
				sections_avg: 97,
			},
		};

		expect(() => validateMComparison(validMComparison)).to.not.throw();
	});

	it("should throw QueryError for invalid MComparison type", () => {
		const invalidMComparison = {
			LT: "invalidType",
		};

		expect(() => validateMComparison(invalidMComparison)).to.throw(
			QueryError,
			"MComparison for LT has invalid type"
		);
	});

	it("should throw QueryError for missing field key", () => {
		const invalidMComparison = {
			LT: {},
		};

		expect(() => validateMComparison(invalidMComparison)).to.throw(QueryError, "LT must have exactly one key");
	});

	it("should throw QueryError for excess field key", () => {
		const invalidMComparison = {
			LT: {
				sections_avg: 97,
				sections_avgs: 97
			},
		};

		expect(() => validateSComparison(invalidMComparison)).to.throw(QueryError, "LT must have exactly one key");
	});

	it("should throw QueryError for non-number field value", () => {
		const invalidMComparison = {
			GT: {
				sections_avg: "invalidValue",
			},
		};

		expect(() => validateMComparison(invalidMComparison)).to.throw(
			QueryError,
			"Invalid value for sections_avg in MComparison. Expected a number"
		);
	});

	it("should not throw an error for valid MComparison with decimal number", () => {
		const validMComparison = {
			EQ: {
				sections_avg: 97.5,
			},
		};

		expect(() => validateMComparison(validMComparison)).to.not.throw();
	});
});

describe("validateSComparison", () => {
	it("should not throw an error for valid SComparison", () => {
		const validSComparison = {
			IS: {
				course_dept: "CPSC",
			},
		};

		expect(() => validateSComparison(validSComparison)).to.not.throw();
	});

	it("should throw QueryError for invalid SComparison type", () => {
		const invalidSComparison = {
			IS: "invalidType",
		};

		expect(() => validateSComparison(invalidSComparison)).to.throw(
			QueryError,
			"SComparison for IS has invalid type"
		);
	});

	it("should throw QueryError for missing field key", () => {
		const invalidSComparison = {
			IS: {},
		};

		expect(() => validateSComparison(invalidSComparison)).to.throw(QueryError, "IS must have exactly one key");
	});

	it("should throw QueryError for excess field key", () => {
		const invalidSComparison = {
			IS: {
				course_dept: "CPSC",
				course_depts: "CPSC"
			},
		};

		expect(() => validateSComparison(invalidSComparison)).to.throw(QueryError, "IS must have exactly one key");
	});

	it("should throw QueryError for non-string field value", () => {
		const invalidSComparison = {
			IS: {
				course_dept: 42,
			},
		};

		expect(() => validateSComparison(invalidSComparison)).to.throw(
			QueryError,
			"Invalid value for course_dept in SComparison. Expected a string"
		);
	});

	it("should not throw an error for valid SComparison with string value", () => {
		const validSComparison = {
			IS: {
				course_dept: "CPSC",
			},
		};

		expect(() => validateSComparison(validSComparison)).to.not.throw();
	});
});
