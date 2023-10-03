import {QueryError} from "../../src/models/IQuery";

// Import necessary modules
import {expect} from "chai";
import {validateQuery} from "../../src/utils/QueryValidator"; // Replace with the actual module path


describe("validateQuery", () => {
	it("should not throw an error for a valid query object", () => {
		const validQuery = {
			WHERE: {
				GT: {
					sections_avg: 97,
				}
			},
			OPTIONS: {
				COLUMNS: ["sections_dept"],
				ORDER: "sections_avg"
			}
		};

		expect(() => validateQuery(validQuery)).to.not.throw();
	});

	it("should throw QueryError for excess keys in the query", () => {
		const invalidQuery = {
			WHERE: {
				GT: {
					sections_avg: 97,
				}
			},
			OPTIONS: {
				COLUMNS: ["sections_dept"],
				ORDER: "sections_avg"
			},
			EXTRA_KEY: "value", // Adding an extra key
		};

		expect(() => validateQuery(invalidQuery)).to.throw(QueryError, "Excess Keys in Query");
	});

	it("should throw QueryError for missing WHERE", () => {
		const invalidQuery = {
			OPTIONS: {
				COLUMNS: ["sections_dept", "sections_avg"],
				ORDER: "sections_avg",
			}
		};

		expect(() => validateQuery(invalidQuery)).to.throw(QueryError, "Missing WHERE");
	});

	it("should throw QueryError for missing OPTIONS", () => {
		const invalidQuery = {
			WHERE: {
				GT: {
					sections_avg: 97,
				}
			}
		};

		expect(() => validateQuery(invalidQuery)).to.throw(QueryError, "Missing OPTIONS");
	});
});
