import {Negation} from "../../src/query/IQuery";

import {expect} from "chai";
import QueryValidator from "../../src/query/QueryValidator";
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

		it("should throw InsightError for null WHERE", () => {
			const invalidQuery = {
				WHERE: null,
				OPTIONS: {
					COLUMNS: ["sections_dept"],
					ORDER: "sections_avg",
				},
			};

			expect(() => QV.validateQueryOutside(invalidQuery)).to.throw(InsightError, "WHERE must be object");
		});

		it("should throw InsightError null OPTIONS", () => {
			const invalidQuery = {
				WHERE: {},
				OPTIONS: null,
			};

			expect(() => QV.validateQueryOutside(invalidQuery)).to.throw(InsightError, "OPTIONS must be object");
		});

		it("should throw InsightError null TRANSFORMATIONS", () => {
			const invalidQuery = {
				WHERE: {},
				OPTIONS: {},
				TRANSFORMATIONS: null,
			};

			expect(() => QV.validateQueryOutside(invalidQuery)).to.throw(
				InsightError,
				"TRANSFORMATIONS must be object"
			);
		});

		it("should throw InsightError array TRANSFORMATIONS", () => {
			const invalidQuery = {
				WHERE: {},
				OPTIONS: {},
				TRANSFORMATIONS: [],
			};

			expect(() => QV.validateQueryOutside(invalidQuery)).to.throw(
				InsightError,
				"TRANSFORMATIONS must be object"
			);
		});

		it("should throw InsightError string TRANSFORMATIONS", () => {
			const invalidQuery = {
				WHERE: {},
				OPTIONS: {},
				TRANSFORMATIONS: "string",
			};

			expect(() => QV.validateQueryOutside(invalidQuery)).to.throw(
				InsightError,
				"TRANSFORMATIONS must be object"
			);
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

		it("should throw InsightError for WHERE must be object (string)", () => {
			const invalidQuery = {
				WHERE: "invalidType",
				OPTIONS: {
					COLUMNS: ["sections_dept", "sections_avg"],
					ORDER: "sections_avg",
				},
			};

			expect(() => QV.validateQueryOutside(invalidQuery)).to.throw(InsightError, "WHERE must be object");
		});

		it("should throw InsightError for WHERE must be object (array)", () => {
			const invalidQuery = {
				WHERE: [],
				OPTIONS: {
					COLUMNS: ["sections_dept", "sections_avg"],
					ORDER: "sections_avg",
				},
			};

			expect(() => QV.validateQueryOutside(invalidQuery)).to.throw(InsightError, "WHERE must be object");
		});

		it("should throw InsightError for OPTIONS must be object (string)", () => {
			const invalidQuery = {
				WHERE: {
					GT: {
						sections_avg: 97,
					},
				},
				OPTIONS: "invalidType",
			};

			expect(() => QV.validateQueryOutside(invalidQuery)).to.throw(InsightError, "OPTIONS must be object");
		});

		it("should throw InsightError for OPTIONS must be object (array)", () => {
			const invalidQuery = {
				WHERE: {
					GT: {
						sections_avg: 97,
					},
				},
				OPTIONS: [],
			};

			expect(() => QV.validateQueryOutside(invalidQuery)).to.throw(InsightError, "OPTIONS must be object");
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

		it("should throw InsightError for non-string in columns", () => {
			const invalidOptions = {
				COLUMNS: ["ubc_lat", {}],
				ORDER: "col1",
			};

			expect(() => QV.validateOptions(invalidOptions)).to.throw(
				InsightError,
				"All elements in COLUMNS must be strings"
			);
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
				"Invalid Order type. Must be string or object."
			);
		});

		it("should throw InsightError for invalid ORDER key", () => {
			const invalidOptions = {
				COLUMNS: ["sections_dept", "sections_avg"],
				ORDER: "sections",
			};

			expect(() => QV.validateOptions(invalidOptions)).to.throw(
				InsightError,
				"All ORDER keys must be in COLUMNS"
			);
		});

		it("should throw InsightError for columns contains invalid key", () => {
			const invalidOptions = {
				COLUMNS: ["sections_avg", "sections"],
				ORDER: "sections_dept",
			};

			expect(() => QV.validateOptions(invalidOptions)).to.throw(InsightError, "Invalid key in COLUMNS: sections");
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
				"LT value has invalid type"
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

			expect(() => QV.validateMComparison(invalidMComparison)).to.throw(
				InsightError,
				"Invalid key in GT: coursedept"
			);
		});

		it("should throw InsightError for invalid mKey", () => {
			const invalidMComparison = {
				GT: {
					course_dept: 28,
				},
			};

			expect(() => QV.validateMComparison(invalidMComparison)).to.throw(
				InsightError,
				"Invalid key in GT: course_dept"
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
				"Invalid value type for course_dept in IS. Expected a string"
			);
		});

		it("should throw InsightError for missing underscore in sKey", () => {
			const invalidSComparison = {
				IS: {
					coursedept: "valid",
				},
			};

			expect(() => QV.validateSComparison(invalidSComparison)).to.throw(
				InsightError,
				"Invalid key in IS: coursedept"
			);
		});

		it("should throw InsightError for invalid sKey", () => {
			const invalidSComparison = {
				IS: {
					course_avg: "valid",
				},
			};

			expect(() => QV.validateSComparison(invalidSComparison)).to.throw(
				InsightError,
				"Invalid key in IS: course_avg"
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
				"Invalid value type for course_dept in IS. Expected a string"
			);
		});
	});

	describe("validateWhere", () => {
		it("should throw InsightError for invalid mComparator", () => {
			const invalidMComparison = {
				INVALID: {
					course_dept: 28,
				},
			};

			expect(() => QV.validateWhere(invalidMComparison)).to.throw(InsightError, "Invalid key in WHERE");
		});

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

		it("should throw InsightError for WHERE must be object", () => {
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

	describe("validateTransformations", () => {
		it("should not throw for valid transformations", () => {
			const transformations = {
				GROUP: ["rooms_lat", "rooms_lon"],
				APPLY: [
					{
						maxSeats: {
							MAX: "rooms_seats",
						},
					},
				],
			};

			expect(() => QV.validateTransformations(transformations)).to.not.throw();
		});
		it("should throw if GROUP is not in transformations", () => {
			const transformations = {
				APPLY: [],
			};
			expect(() => QV.validateTransformations(transformations)).to.throw(
				InsightError,
				"TRANSFORMATIONS missing GROUP"
			);
		});

		it("should throw if APPLY is not in transformations", () => {
			const transformations = {
				GROUP: [],
			};
			expect(() => QV.validateTransformations(transformations)).to.throw(
				InsightError,
				"TRANSFORMATIONS missing APPLY"
			);
		});

		it("should throw if GROUP is not an array", () => {
			const transformations = {
				GROUP: {},
				APPLY: [],
			};
			expect(() => QV.validateTransformations(transformations)).to.throw(
				InsightError,
				"GROUP must be a non-empty array"
			);
		});

		it("should throw if APPLY is not an array", () => {
			const transformations = {
				GROUP: [],
				APPLY: {},
			};
			expect(() => QV.validateTransformations(transformations)).to.throw(
				InsightError,
				"APPLY must be a non-empty array"
			);
		});

		it("should throw if not all elements in GROUP are strings", () => {
			const transformations = {
				GROUP: ["validKey1", {}, "validKey3"],
				APPLY: [],
			};
			expect(() => QV.validateTransformations(transformations)).to.throw(
				InsightError,
				"All elements in GROUP must be strings"
			);
		});

		it("should throw if an invalid key is present in GROUP", () => {
			// Assuming validateKey returns false for 'invalidKey'
			const transformations = {
				GROUP: ["rooms_lat", "invalidKey"],
				APPLY: [],
			};
			expect(() => QV.validateTransformations(transformations)).to.throw(
				InsightError,
				"Invalid key in GROUP: invalidKey"
			);
		});

		it("should throw if an apply rule in APPLY is invalid", () => {
			// Assuming validateApplyRule would throw an error for the given rule
			const transformations = {
				GROUP: ["validKey"],
				APPLY: [{invalidRule: {}}],
			};
			expect(() => QV.validateTransformations(transformations)).to.throw(InsightError);
		});
	});

	describe("validateApplyRule", () => {
		it("should not throw for valid ApplyRule", () => {
			expect(() => QV.validateApplyRule({maxSeats: {MAX: "rooms_seats"}})).to.not.throw(InsightError);
		});

		it("should throw if rule has more than one key", () => {
			expect(() => QV.validateApplyRule({key1: {}, key2: {}})).to.throw(
				InsightError,
				"Apply rule should only have 1 key, has 2"
			);
		});

		it("should throw if applyKey has underscore", () => {
			expect(() => QV.validateApplyRule({key_with_underscore: {}})).to.throw(
				InsightError,
				"Cannot have underscore in applyKey"
			);
		});

		it("should throw if applyValue is not an object", () => {
			expect(() => QV.validateApplyRule({validKey: "invalidValue"})).to.throw(
				InsightError,
				"Apply body must be object"
			);
		});

		it("should throw if applyValue has more than one key", () => {
			expect(() => QV.validateApplyRule({validKey: {key1: "val1", key2: "val2"}})).to.throw(
				InsightError,
				"Apply body should only have 1 key, has 2"
			);
		});

		it("should throw for invalid transformation operator", () => {
			expect(() => QV.validateApplyRule({validKey: {INVALID: "targetKey"}})).to.throw(
				InsightError,
				"Invalid transformation operator"
			);
		});

		it("should throw if applyValue[token] is not a string", () => {
			expect(() => QV.validateApplyRule({validKey: {MAX: {invalid: "value"}}})).to.throw(
				InsightError,
				"Invalid apply rule target key"
			);
		});

		it("should throw for invalid key in applyValue[token]", () => {
			// Assuming `validateKey` returns false for 'invalidKey'
			expect(() => QV.validateApplyRule({validKey: {MAX: "invalidKey"}})).to.throw(
				InsightError,
				"Invalid key in MAX: invalidKey"
			);
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

		it("should fail due to querying from multiple dataset (2)", () => {
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

		it("should throw an error for missing WHERE in query", () => {
			const queryWithoutWhere = {
				OPTIONS: {
					COLUMNS: ["dept_id", "title"],
					ORDER: "dept_id",
				},
			};

			expect(() => QV.validateQuery(queryWithoutWhere)).to.throw("Missing WHERE");
		});

		it("should throw an error for WHERE must be object", () => {
			const queryWithInvalidWhere = {
				WHERE: "invalid",
				OPTIONS: {
					COLUMNS: ["dept_id", "title"],
					ORDER: "dept_id",
				},
			};

			expect(() => QV.validateQuery(queryWithInvalidWhere)).to.throw("WHERE must be object");
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

	describe("validateOrder", function () {
		const validKeys = ["ubc_lat", "validKey2"];

		it("should not throw an error for a valid string order", () => {
			expect(() => QV.validateOrder("ubc_lat", validKeys)).to.not.throw();
		});

		it("should throw an error for an invalid string order", () => {
			expect(() => QV.validateOrder("invalidKey", validKeys)).to.throw("All ORDER keys must be in COLUMNS");
		});

		it("should not throw an error for a valid object order", () => {
			const validOrder = {dir: "DOWN", keys: ["ubc_lat"]};
			expect(() => QV.validateOrder(validOrder, validKeys)).to.not.throw();
		});

		it("should throw an error for missing dir in order object", () => {
			const invalidOrder = {keys: ["validKey1"]};
			expect(() => QV.validateOrder(invalidOrder, validKeys)).to.throw("Invalid Order structure");
		});

		it("should throw an error for invalid dir value in order object", () => {
			const invalidOrder = {dir: "LEFT", keys: ["validKey1"]};
			expect(() => QV.validateOrder(invalidOrder, validKeys)).to.throw("Invalid ORDER direction.");
		});

		it("should throw an error for missing keys in order object", () => {
			const invalidOrder = {dir: "UP"};
			expect(() => QV.validateOrder(invalidOrder, validKeys)).to.throw("Invalid Order structure");
		});

		it("should throw an error for invalid keys type in order object", () => {
			const invalidOrder = {dir: "UP", keys: "validKey1"};
			expect(() => QV.validateOrder(invalidOrder, validKeys)).to.throw("ORDER keys must be a non-empty array");
		});

		it("should throw an error for a key in keys array that's not in columnKeys", () => {
			const invalidOrder = {dir: "UP", keys: ["anotherInvalidKey"]};
			expect(() => QV.validateOrder(invalidOrder, validKeys)).to.throw("All ORDER keys must be in COLUMNS");
		});

		it("should throw an error for an invalid order type", () => {
			expect(() => QV.validateOrder(12345, validKeys)).to.throw("Invalid Order type. Must be string or object.");
		});
	});
});
