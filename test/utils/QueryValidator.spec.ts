import {QueryError} from "../../src/models/IQuery";

// Import necessary modules
import {expect} from "chai";
import {validateQueryOutside, validateOptions} from "../../src/utils/QueryValidator"; // Replace with the actual module path

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
