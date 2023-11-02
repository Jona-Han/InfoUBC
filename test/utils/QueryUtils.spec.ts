import {
	validateKeyMatchesKind,
	orderEntriesByString,
	orderEntriesBySortObject,
	applyRules,
} from "../../src/utils/QueryUtils";
import {expect} from "chai";
import {InsightDatasetKind, InsightError} from "../../src/controller/IInsightFacade";
import {ApplyRule} from "../../src/models/IQuery";

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
			console.log(entries);
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

	describe("applyRules function", () => {
		const sections = [
			{avg: 1, pass: 3, fail: 4},
			{avg: 2, pass: 3, fail: 2},
			{avg: 2, pass: 2, fail: 3},
			{avg: 3, pass: 1, fail: 1},
		];

		let result: any;

		beforeEach(() => {
			result = {}; // Reset the result before each test
		});

		it("should calculate MAX correctly", () => {
			const rules = [{maxCourse: {MAX: "course_avg"}}];
			applyRules(sections, result, rules, InsightDatasetKind.Sections);
			expect(result.maxCourse).to.equal(3);
		});

		it("should calculate MIN correctly", () => {
			const rules = [{minCourse: {MIN: "course_avg"}}];
			applyRules(sections, result, rules, InsightDatasetKind.Sections);
			expect(result.minCourse).to.equal(1);
		});

		it("should calculate AVG correctly", () => {
			const rules = [{avgCourse: {AVG: "course_avg"}}];
			applyRules(sections, result, rules, InsightDatasetKind.Sections);
			expect(result.avgCourse).to.equal(2); // (1 + 2 + 2 + 3) / 4 = 2
		});

		it("should calculate SUM correctly", () => {
			const rules = [{sumCourse: {SUM: "course_avg"}}];
			applyRules(sections, result, rules, InsightDatasetKind.Sections);
			expect(result.sumCourse).to.equal(8); // 1 + 2 + 2 + 3 = 8
		});

		it("should calculate COUNT correctly", () => {
			const rules = [{countCourse: {COUNT: "course_avg"}}];
			applyRules(sections, result, rules, InsightDatasetKind.Sections);
			expect(result.countCourse).to.equal(3); // 3 distinct values
		});

		it("should apply multiple rules correctly", () => {
			const rules = [{maxCourse: {MAX: "course_avg"}}, {countCourse: {COUNT: "course_avg"}}] as ApplyRule[];
			applyRules(sections, result, rules, InsightDatasetKind.Sections);
			expect(result.maxCourse).to.equal(3);
			expect(result.countCourse).to.equal(3);
		});

		it("should handle no rules scenario", () => {
			applyRules(sections, result, undefined, InsightDatasetKind.Sections);
			expect(result).to.deep.equal({}); // No changes should be made to the result
		});

		// Add more tests if you identify additional edge cases.
	});
});
