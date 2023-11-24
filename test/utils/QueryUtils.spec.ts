import {validateKeyMatchesKind, orderEntriesByString, orderEntriesBySortObject} from "../../src/utils/SortUtils";
import {expect} from "chai";
import {InsightDatasetKind, InsightError} from "../../src/controller/IInsightFacade";

describe("Validation and Ordering Functions", () => {
	describe("validateKeyMatchesKind", () => {
		it("should validate section key for sections dataset kind", () => {
			expect(() => validateKeyMatchesKind("course_avg", InsightDatasetKind.Sections)).not.to.throw();
		});

		it("should validate room key for rooms dataset kind", () => {
			expect(() => validateKeyMatchesKind("room_shortname", InsightDatasetKind.Rooms)).not.to.throw();
		});

		it("should throw for invalid key in sections", () => {
			expect(() => validateKeyMatchesKind("course_invalid", InsightDatasetKind.Sections)).to.throw(InsightError);
		});

		it("should throw for invalid key in rooms", () => {
			expect(() => validateKeyMatchesKind("room_invalid", InsightDatasetKind.Rooms)).to.throw(InsightError);
		});

		it("should throw if key is undefined", () => {
			expect(() => validateKeyMatchesKind(undefined, InsightDatasetKind.Rooms)).to.throw(InsightError);
		});

		it("should throw if kind is undefined", () => {
			expect(() => validateKeyMatchesKind("course_avg", undefined)).to.throw(InsightError);
		});
	});

	describe("orderEntriesByString", () => {
		let entries: any[];

		beforeEach(() => {
			entries = [{avg: 2}, {avg: 1}, {avg: 3}];
		});

		it("should order by string correctly", () => {
			orderEntriesByString(entries, "course_avg", InsightDatasetKind.Sections);
			expect(entries[0].avg).to.equal(1);
			expect(entries[1].avg).to.equal(2);
			expect(entries[2].avg).to.equal(3);
		});

		it("should throw if invalid order key", () => {
			expect(() => orderEntriesByString(entries, "invalid_key", InsightDatasetKind.Sections)).to.throw(
				InsightError
			);
		});
	});

	describe("orderEntriesBySortObject", () => {
		let entries: any[];

		beforeEach(() => {
			entries = [
				{avg: 1, pass: 3},
				{avg: 3, pass: 1},
				{avg: 2, pass: 2},
			];
		});

		it("should order by sort object (single key) correctly in descending order", () => {
			orderEntriesBySortObject(entries, {dir: "DOWN", keys: ["course_pass"]}, InsightDatasetKind.Sections);
			expect(entries[0].avg).to.equal(1);
			expect(entries[1].avg).to.equal(2);
			expect(entries[2].avg).to.equal(3);
		});

		it("should order by sort object (single key) correctly in ascending order", () => {
			orderEntriesBySortObject(entries, {dir: "UP", keys: ["course_pass"]}, InsightDatasetKind.Sections);
			expect(entries[0].avg).to.equal(3);
			expect(entries[1].avg).to.equal(2);
			expect(entries[2].avg).to.equal(1);
		});

		it("should order by sort object (multi key) correctly", () => {
			orderEntriesBySortObject(
				entries,
				{dir: "DOWN", keys: ["course_avg", "course_pass"]},
				InsightDatasetKind.Sections
			);
			expect(entries[0].avg).to.equal(3);
			expect(entries[1].avg).to.equal(2);
			expect(entries[2].avg).to.equal(1);
		});

		it("should throw if invalid order key", () => {
			expect(() =>
				orderEntriesBySortObject(entries, {dir: "UP", keys: ["invalid_key"]}, InsightDatasetKind.Sections)
			).to.throw(InsightError);
		});
	});
});
