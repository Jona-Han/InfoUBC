import {expect} from "chai";
import {InsightDatasetKind} from "../../src/controller/IInsightFacade";
import {ApplyRule} from "../../src/query/IQuery";
import {applyRules} from "../../src/utils/TransformUtils";

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
});
