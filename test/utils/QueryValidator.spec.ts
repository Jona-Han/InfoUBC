import {Negation} from "../../src/models/IQuery";

import {expect} from "chai";
import QueryValidator from "../../src/utils/QueryValidator";
import {InsightError} from "../../src/controller/IInsightFacade";

describe("QueryValidator", () => {
	let QV: QueryValidator;
	beforeEach(() => {
		QV = new QueryValidator();
	});

	describe("validateQueryOutside", () => {
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

			expect(() => QV.validateQueryOutside(validQuery)).to.not.throw();
		});

		it("should throw InsightError for excess keys in the query", () => {
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

			expect(() => QV.validateQueryOutside(invalidQuery)).to.throw(InsightError, "Excess Keys in Query");
		});

		it("should throw InsightError for missing WHERE", () => {
			const invalidQuery = {
				OPTIONS: {
					COLUMNS: ["sections_dept", "sections_avg"],
					ORDER: "sections_avg",
				},
			};

			expect(() => QV.validateQueryOutside(invalidQuery)).to.throw(InsightError, "Missing WHERE");
		});

		it("should throw InsightError for missing OPTIONS", () => {
			const invalidQuery = {
				WHERE: {
					GT: {
						sections_avg: 97,
					},
				},
			};

			expect(() => QV.validateQueryOutside(invalidQuery)).to.throw(InsightError, "Missing OPTIONS");
		});

		it("should throw InsightError for invalid WHERE type (string)", () => {
			const invalidQuery = {
				WHERE: "invalidType",
				OPTIONS: {
					COLUMNS: ["sections_dept", "sections_avg"],
					ORDER: "sections_avg",
				},
			};

			expect(() => QV.validateQueryOutside(invalidQuery)).to.throw(InsightError, "Invalid WHERE type");
		});

		it("should throw InsightError for invalid WHERE type (array)", () => {
			const invalidQuery = {
				WHERE: [],
				OPTIONS: {
					COLUMNS: ["sections_dept", "sections_avg"],
					ORDER: "sections_avg",
				},
			};

			expect(() => QV.validateQueryOutside(invalidQuery)).to.throw(InsightError, "Invalid WHERE type");
		});

		it("should throw InsightError for invalid OPTIONS type (string)", () => {
			const invalidQuery = {
				WHERE: {
					GT: {
						sections_avg: 97,
					},
				},
				OPTIONS: "invalidType",
			};

			expect(() => QV.validateQueryOutside(invalidQuery)).to.throw(InsightError, "Invalid OPTIONS type");
		});

		it("should throw InsightError for invalid OPTIONS type (array)", () => {
			const invalidQuery = {
				WHERE: {
					GT: {
						sections_avg: 97,
					},
				},
				OPTIONS: [],
			};

			expect(() => QV.validateQueryOutside(invalidQuery)).to.throw(InsightError, "Invalid OPTIONS type");
		});

		// Test cases for validateQueryOutside
		it("should validate the outside query with valid keys", () => {
			const validOutsideQuery = {
				WHERE: {
					AND: [
						{
							GT: {
								ubc_avg: 90,
							},
						},
					],
				},
				OPTIONS: {
					COLUMNS: ["dept_id", "title"],
					ORDER: "dept_id",
				},
			};

			expect(() => QV.validateQueryOutside(validOutsideQuery)).to.not.throw();
		});

		it("should throw an error for excess keys in the outside query", () => {
			const outsideQueryWithExcessKeys = {
				WHERE: {
					AND: [
						{
							GT: {
								ubc_avg: 90,
							},
						},
					],
				},
				OPTIONS: {
					COLUMNS: ["dept_id", "title"],
					ORDER: "dept_id",
				},
				INVALID_KEY: "value",
			};

			expect(() => QV.validateQuery(outsideQueryWithExcessKeys)).to.throw("Excess Keys in Query");
		});
	});

	describe("validateOptions", () => {
		it("should not throw an error for valid options", () => {
			const validOptions = {
				COLUMNS: ["sections_dept", "sections_avg"],
				ORDER: "sections_dept",
			};

			expect(() => QV.validateOptions(validOptions)).to.not.throw();
		});

		it("should throw InsightError for excess keys", () => {
			const invalidOptions = {
				COLUMNS: ["sections_dept", "sections_avg"],
				ORDER: "sections_dept",
				EXTRA_KEY: "value", // Extra key
			};

			expect(() => QV.validateOptions(invalidOptions)).to.throw(InsightError, "Excess Keys in Options");
		});

		it("should throw InsightError for missing COLUMNS", () => {
			const invalidOptions = {
				ORDER: "col1",
			};

			expect(() => QV.validateOptions(invalidOptions)).to.throw(InsightError, "Options missing COLUMNS");
		});

		it("should throw InsightError for empty COLUMNS", () => {
			const invalidOptions = {
				COLUMNS: [],
				ORDER: "col1",
			};

			expect(() => QV.validateOptions(invalidOptions)).to.throw(InsightError, "COLUMNS must be non-empty array");
		});

		it("should throw InsightError for invalid keys", () => {
			const invalidOptions = {
				COLUMNS: ["sections_dept", "sections_avg"],
				INVALID: "sections_dept",
			};

			expect(() => QV.validateOptions(invalidOptions)).to.throw(InsightError, "Options contains invalid keys");
		});

		it("should throw InsightError for invalid ORDER type", () => {
			const invalidOptions = {
				COLUMNS: ["sections_dept", "sections_avg"],
				ORDER: 52,
			};

			expect(() => QV.validateOptions(invalidOptions)).to.throw(
				InsightError,
				"Invalid Order type. Must be string."
			);
		});

		it("should throw InsightError for invalid ORDER type", () => {
			const invalidOptions = {
				COLUMNS: ["sections_dept", "sections_avg"],
				ORDER: "sections",
			};

			expect(() => QV.validateOptions(invalidOptions)).to.throw(InsightError, "Invalid query key");
		});

		it("should throw InsightError for columns contains invalid key", () => {
			const invalidOptions = {
				COLUMNS: ["sections_avg", "sections"],
				ORDER: "sections_dept",
			};

			expect(() => QV.validateOptions(invalidOptions)).to.throw(InsightError, "Invalid query key");
		});
	});

	describe("validateMComparison", () => {
		it("should not throw an error for valid MComparison", () => {
			const validMComparison = {
				LT: {
					sections_avg: 97,
				},
			};

			expect(() => QV.validateMComparison(validMComparison)).to.not.throw();
		});

		it("should throw InsightError for invalid MComparison type", () => {
			const invalidMComparison = {
				LT: "invalidType",
			};

			expect(() => QV.validateMComparison(invalidMComparison)).to.throw(
				InsightError,
				"MComparison for LT has invalid type"
			);
		});

		it("should throw InsightError for missing field key", () => {
			const invalidMComparison = {
				LT: {},
			};

			expect(() => QV.validateMComparison(invalidMComparison)).to.throw(
				InsightError,
				"LT must have exactly one key"
			);
		});

		it("should throw InsightError for missing underscore in mKey", () => {
			const invalidMComparison = {
				GT: {
					coursedept: 83,
				},
			};

			expect(() => QV.validateMComparison(invalidMComparison)).to.throw(InsightError, "Invalid query key");
		});

		it("should throw InsightError for invalid mKey", () => {
			const invalidMComparison = {
				GT: {
					course_dept: 28,
				},
			};

			expect(() => QV.validateMComparison(invalidMComparison)).to.throw(
				InsightError,
				"Invalid type for MComparison. dept is not a valid type"
			);
		});

		it("should throw InsightError for excess field key", () => {
			const invalidMComparison = {
				LT: {
					sections_avg: 97,
					sections_avgs: 97,
				},
			};

			expect(() => QV.validateMComparison(invalidMComparison)).to.throw(
				InsightError,
				"LT must have exactly one key"
			);
		});

		it("should throw InsightError for non-number field value", () => {
			const invalidMComparison = {
				GT: {
					sections_avg: "invalidValue",
				},
			};

			expect(() => QV.validateMComparison(invalidMComparison)).to.throw(
				InsightError,
				"Invalid value for sections_avg in MComparison. Expected a number"
			);
		});

		it("should not throw an error for valid MComparison with decimal number", () => {
			const validMComparison = {
				EQ: {
					sections_avg: 97.5,
				},
			};

			expect(() => QV.validateMComparison(validMComparison)).to.not.throw();
		});
	});

	describe("validateSComparison", () => {
		it("should not throw an error for valid SComparison", () => {
			const validSComparison = {
				IS: {
					course_dept: "CPSC",
				},
			};

			expect(() => QV.validateSComparison(validSComparison)).to.not.throw();
		});

		it("should throw InsightError for invalid SComparison type", () => {
			const invalidSComparison = {
				IS: "invalidType",
			};

			expect(() => QV.validateSComparison(invalidSComparison)).to.throw(
				InsightError,
				"SComparison for IS has invalid type"
			);
		});

		it("should throw InsightError for missing field key", () => {
			const invalidSComparison = {
				IS: {},
			};

			expect(() => QV.validateSComparison(invalidSComparison)).to.throw(
				InsightError,
				"IS must have exactly one key"
			);
		});

		it("should throw InsightError for excess field key", () => {
			const invalidSComparison = {
				IS: {
					course_dept: "CPSC",
					course_depts: "CPSC",
				},
			};

			expect(() => QV.validateSComparison(invalidSComparison)).to.throw(
				InsightError,
				"IS must have exactly one key"
			);
		});

		it("should throw InsightError for non-string field value", () => {
			const invalidSComparison = {
				IS: {
					course_dept: 42,
				},
			};

			expect(() => QV.validateSComparison(invalidSComparison)).to.throw(
				InsightError,
				"Invalid value for course_dept in SComparison. Expected a string"
			);
		});

		it("should throw InsightError for missing underscore in sKey", () => {
			const invalidSComparison = {
				IS: {
					coursedept: "valid",
				},
			};

			expect(() => QV.validateSComparison(invalidSComparison)).to.throw(InsightError, "Invalid query key");
		});

		it("should throw InsightError for invalid sKey", () => {
			const invalidSComparison = {
				IS: {
					course_avg: "valid",
				},
			};

			expect(() => QV.validateSComparison(invalidSComparison)).to.throw(
				InsightError,
				"Invalid type for SComparison. avg is not a valid type"
			);
		});

		it("should not throw an error for valid SComparison with string value", () => {
			const validSComparison = {
				IS: {
					course_dept: "CPSC",
				},
			};

			expect(() => QV.validateSComparison(validSComparison)).to.not.throw();
		});
	});

	describe("validateNot", () => {
		it("should not throw an error for valid NOT", () => {
			const validNot = {
				NOT: {
					EQ: {
						sections_avg: 97,
					},
				},
			};

			expect(() => QV.validateNot(validNot)).to.not.throw();
		});

		it("should throw InsightError for object in not missing keys", () => {
			const invalidNot = {
				NOT: {},
			};

			expect(() => QV.validateNot(invalidNot)).to.throw(InsightError, "Nested Filter must contain 1 key");
		});

		it("should throw InsightError for invalid NOT value", () => {
			const invalidNot = {
				NOT: "invalidType",
			};

			expect(() => QV.validateNot(invalidNot)).to.throw(InsightError, "NOT value must be object");
		});

		it("should throw InsightError for invalid nested WHERE", () => {
			const invalidNot = {
				NOT: {
					INVALID: {
						sections_avg: 97,
					},
				},
			};

			expect(() => QV.validateNot(invalidNot)).to.throw(InsightError, "Invalid key in WHERE");
		});

		it("should throw InsightError for invalid nested MComparison", () => {
			const invalidNot = {
				NOT: {
					LT: {
						sections_avg: "invalidValue",
					},
				},
			};

			expect(() => QV.validateNot(invalidNot as Negation)).to.throw(
				InsightError,
				"Invalid value for sections_avg in MComparison. Expected a number"
			);
		});
	});

	describe("validateLogicComparison", () => {
		it("should not throw an error for valid LogicComparison (AND)", () => {
			const validLogicComparison = {
				AND: [
					{
						LT: {
							sections_avg: 95,
						},
					},
					{
						EQ: {
							sections_avg: 85,
						},
					},
				],
			};

			expect(() => QV.validateLogicComparison(validLogicComparison)).to.not.throw();
		});

		it("should not throw an error for valid LogicComparison (OR)", () => {
			const validLogicComparison = {
				OR: [
					{
						LT: {
							sections_avg: 85,
						},
					},
					{
						GT: {
							sections_avg: 90,
						},
					},
				],
			};

			expect(() => QV.validateLogicComparison(validLogicComparison)).to.not.throw();
		});

		it("should throw InsightError for invalid LogicComparison type", () => {
			const invalidLogicComparison = {
				AND: "invalidType",
			};

			expect(() => QV.validateLogicComparison(invalidLogicComparison)).to.throw(
				InsightError,
				"AND should be non-empty array"
			);
		});

		it("should throw InsightError for empty LogicComparison array", () => {
			const invalidLogicComparison = {
				OR: [],
			};

			expect(() => QV.validateLogicComparison(invalidLogicComparison)).to.throw(
				InsightError,
				"OR should be non-empty array"
			);
		});

		it("should throw InsightError for invalid nested WHERE", () => {
			const invalidLogicComparison = {
				AND: [
					{
						INVALID: {
							sections_avg: 95,
						},
					},
				],
			};

			expect(() => QV.validateLogicComparison(invalidLogicComparison)).to.throw(
				InsightError,
				"Invalid key in WHERE"
			);
		});

		it("should throw InsightError for invalid nested SComparison", () => {
			const invalidLogicComparison = {
				OR: [
					{
						IS: {
							course_dept: 42,
						},
					},
				],
			};

			expect(() => QV.validateLogicComparison(invalidLogicComparison)).to.throw(
				InsightError,
				"Invalid value for course_dept in SComparison. Expected a string"
			);
		});
	});

	describe("validateWhere", () => {
		it("should not throw an error for valid WHERE (AND)", () => {
			const validWhere = {
				AND: [
					{
						GT: {
							sections_avg: 95,
						},
					},
					{
						EQ: {
							sections_avg: 85,
						},
					},
				],
			};

			expect(() => QV.validateWhere(validWhere)).to.not.throw();
		});

		it("should not throw an error for valid WHERE (IS)", () => {
			const validWhere = {
				IS: {
					course_dept: "CPSC",
				},
			};

			expect(() => QV.validateWhere(validWhere)).to.not.throw();
		});

		it("should throw InsightError for invalid WHERE type", () => {
			const invalidWhere = {
				INVALID: {
					sections_avg: 95,
				},
			};

			expect(() => QV.validateWhere(invalidWhere)).to.throw(InsightError, "Invalid key in WHERE");
		});

		it("should throw InsightError for invalid nested LogicComparison", () => {
			const invalidWhere = {
				AND: [
					{
						INVALID: {
							sections_avg: 95,
						},
					},
				],
			};

			expect(() => QV.validateWhere(invalidWhere)).to.throw(InsightError, "Invalid key in WHERE");
		});

		it("should throw InsightError for invalid nested MComparison", () => {
			const invalidWhere = {
				EQ: {
					sections_avg: "invalidValue",
				},
			};

			expect(() => QV.validateWhere(invalidWhere)).to.throw(
				InsightError,
				"Invalid value for sections_avg in MComparison. Expected a number"
			);
		});

		it("should throw InsightError for WHERE with multiple keys", () => {
			const invalidWhere = {
				AND: [
					{
						GT: {
							sections_avg: 95,
						},
					},
					{
						EQ: {
							sections_dept: "CPSC",
						},
					},
				],
				OR: [
					{
						LT: {
							sections_avg: 85,
						},
					},
				],
			};

			expect(() => QV.validateWhere(invalidWhere)).to.throw(InsightError, "Nested Filter must contain 1 key");
		});
	});

	describe("validateMKey", () => {
		it("should not throw for a valid MField input", () => {
			expect(() => QV.validateMKey("validContent_avg")).to.not.throw();
		});

		it("should throw InsightError for an invalid MField input", () => {
			expect(() => QV.validateMKey("validContent_not")).to.throw(
				InsightError,
				"Invalid type for MComparison. not is not a valid type"
			);
		});

		it("should throw InsightError for input without an underscore", () => {
			expect(() => QV.validateMKey("invalidContentavg")).to.throw(
				InsightError,
				"Invalid query key for MComparison"
			);
		});

		it("should throw InsightError for input with more than one underscore", () => {
			expect(() => QV.validateMKey("validContent_avg_extra")).to.throw(
				InsightError,
				"Invalid query key for MComparison"
			);
		});
	});

	describe("validateSKey", () => {
		it("should not throw for a valid SField input", () => {
			expect(() => QV.validateSKey("validContent_dept")).to.not.throw();
		});

		it("should throw InsightError for an invalid SField input", () => {
			expect(() => QV.validateSKey("validContent_not")).to.throw(
				InsightError,
				"Invalid type for SComparison. not is not a valid type"
			);
		});

		it("should throw InsightError for input without an underscore", () => {
			expect(() => QV.validateSKey("invalidContentdept")).to.throw(
				InsightError,
				"Invalid query key for SComparison"
			);
		});

		it("should throw InsightError for input with more than one underscore", () => {
			expect(() => QV.validateSKey("validContent_dept_extra")).to.throw(
				InsightError,
				"Invalid query key for SComparison"
			);
		});
	});

	describe("validateKey", () => {
		it("should not throw for a valid column key input", () => {
			expect(() => QV.validateKey("validContent_dept")).to.not.throw();
		});

		it("should throw InsightError for an invalid column key input", () => {
			expect(() => QV.validateKey("validContent_not")).to.throw(
				InsightError,
				"Invalid key type. not is not a valid type"
			);
		});

		it("should throw InsightError for input without an underscore", () => {
			expect(() => QV.validateKey("invalidContentdept")).to.throw(InsightError, "Invalid query key");
		});

		it("should throw InsightError for input with more than one underscore", () => {
			expect(() => QV.validateKey("validContent_dept_extra")).to.throw(InsightError, "Invalid query key");
		});

		it("should not throw for a valid column key input with MField", () => {
			expect(() => QV.validateKey("validContent_avg")).to.not.throw();
		});

		it("should not throw for a valid column key input with SField", () => {
			expect(() => QV.validateKey("validContent_dept")).to.not.throw();
		});
	});

	describe("Query Validation Integration Tests", () => {
		it("should validate a valid query", () => {
			const validQuery = {
				WHERE: {
					AND: [
						{
							GT: {
								dept_avg: 90,
							},
						},
						{
							EQ: {
								dept_avg: 20,
							},
						},
					],
				},
				OPTIONS: {
					COLUMNS: ["dept_id", "dept_title"],
					ORDER: "dept_id",
				},
			};

			expect(() => QV.validateQuery(validQuery)).to.not.throw();
		});

		it("should fail due to querying from multiple dataset (1)", () => {
			const validQuery = {
				WHERE: {
					AND: [
						{
							GT: {
								dept_avg: 90,
							},
						},
						{
							EQ: {
								ubc_avg: 20,
							},
						},
					],
				},
				OPTIONS: {
					COLUMNS: ["dept_id", "dept_title"],
					ORDER: "dept_id",
				},
			};

			expect(() => QV.validateQuery(validQuery)).to.throw("Cannot query from multiple datasets");
		});

		it("should fail due to querying from multiple dataset (1)", () => {
			const validQuery = {
				WHERE: {
					AND: [
						{
							GT: {
								dept_avg: 90,
							},
						},
						{
							EQ: {
								dept_avg: 20,
							},
						},
					],
				},
				OPTIONS: {
					COLUMNS: ["dept_id", "ubc_title"],
					ORDER: "dept_id",
				},
			};

			expect(() => QV.validateQuery(validQuery)).to.throw("Cannot query from multiple datasets");
		});

		it("should fail due to querying from multiple dataset (1)", () => {
			const validQuery = {
				WHERE: {
					AND: [
						{
							GT: {
								dept_avg: 90,
							},
						},
						{
							EQ: {
								dept_avg: 20,
							},
						},
					],
				},
				OPTIONS: {
					COLUMNS: ["dept_id", "dept_title"],
					ORDER: "ubc_id",
				},
			};

			expect(() => QV.validateQuery(validQuery)).to.throw("Cannot query from multiple datasets");
		});

		it("should throw an error for missing WHERE in query", () => {
			const queryWithoutWhere = {
				OPTIONS: {
					COLUMNS: ["dept_id", "title"],
					ORDER: "dept_id",
				},
			};

			expect(() => QV.validateQuery(queryWithoutWhere)).to.throw("Missing WHERE");
		});

		it("should throw an error for invalid WHERE type", () => {
			const queryWithInvalidWhere = {
				WHERE: "invalid",
				OPTIONS: {
					COLUMNS: ["dept_id", "title"],
					ORDER: "dept_id",
				},
			};

			expect(() => QV.validateQuery(queryWithInvalidWhere)).to.throw("Invalid WHERE type");
		});

		it("should pass and return dept", () => {
			const validQuery = {
				WHERE: {
					EQ: {
						dept_avg: 20,
					},
				},
				OPTIONS: {
					COLUMNS: ["dept_id", "dept_title"],
				},
			};
			const result = QV.validateQuery(validQuery);

			expect(result).to.equal("dept");
		});
	});
});
