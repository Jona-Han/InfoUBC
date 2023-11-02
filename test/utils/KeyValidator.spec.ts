import {expect} from "chai";
import {InsightError} from "../../src/controller/IInsightFacade";
import KeyValidator from "../../src/utils/KeyValidator";

describe("KeyValidator", () => {
	let KV: KeyValidator;

	beforeEach(() => {
		KV = new KeyValidator();
	});

	describe("validateMKey", () => {
		it("should return true for a valid MField input", () => {
			expect(KV.validateMKey("validContent_avg")).to.equal(true);
		});

		it("should return false for an invalid MField input", () => {
			expect(KV.validateMKey("validContent_not")).to.equal(false);
		});

		it("should return false for input without an underscore", () => {
			expect(KV.validateMKey("invalidContentavg")).to.equal(false);
		});

		it("should return false for input with more than one underscore", () => {
			expect(KV.validateMKey("validContent_avg_extra")).to.equal(false);
		});
	});

	describe("validateSKey", () => {
		it("should return true for a valid SField input", () => {
			expect(KV.validateSKey("validContent_dept")).to.equal(true);
		});

		it("should return false for an invalid SField input", () => {
			expect(KV.validateSKey("validContent_not")).to.equal(false);
		});

		it("should return false for input without an underscore", () => {
			expect(KV.validateSKey("invalidContentdept")).to.equal(false);
		});

		it("should return false for input with more than one underscore", () => {
			expect(KV.validateSKey("validContent_dept_extra")).to.equal(false);
		});
	});

	describe("validateGroupKey", () => {
		it("should return true for a valid column key input with MField", () => {
			const result = KV.validateGroupKey("validContent_avg");
			expect(result).to.equal(true);
		});

		it("should return true for a valid column key input with SField", () => {
			const result = KV.validateGroupKey("validContent_dept");
			expect(result).to.equal(true);
		});

		it("should return false for an invalid column key input", () => {
			const result = KV.validateGroupKey("validContent_not");
			expect(result).to.equal(false);
		});

		it("should return false for input without an underscore", () => {
			const result = KV.validateGroupKey("invalidContentdept");
			expect(result).to.equal(false);
		});

		it("should return false for input with more than one underscore", () => {
			const result = KV.validateGroupKey("validContent_dept_extra");
			expect(result).to.equal(false);
		});
	});

	it("should throw for duplicate applyKey", () => {
        // Assuming the `keys` set has a value 'duplicateKey' already
		KV.transformationKeys.add("duplicateKey");
		expect(() => KV.validateApplyKey("duplicateKey"))
			.to.throw(InsightError, "Duplicate APPLY key duplicateKey");
	});
});
