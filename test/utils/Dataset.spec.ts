import {InsightError} from "../../src/controller/IInsightFacade";
import Dataset from "../../src/models/Dataset";
import {expect, use} from "chai";
describe("InsightFacade", async function () {
	let dataset: Dataset;

	describe("addSection", async function () {
		beforeEach(function () {
			dataset = new Dataset("ubc");
		});

		it("Add a single section", function () {
			let section = {
				Title: "",
				id: "25945",
				Professor: "",
				Audit: 0,
				Year: 2013,
				Course: "100",
				Pass: 3,
				Fail: 0,
				Avg: 60,
				Subject: "test",
			};
			dataset.addSection(section);
			expect(dataset.getSize()).to.equal(1);
		});

		it("Add a single section where inputs are incorrect types but can be parsed to correct types", function () {
			let section = {
				Title: 1234,
				id: 25945,
				Professor: 123,
				Audit: "0",
				Year: "2013",
				Course: 100,
				Pass: "3",
				Fail: "0",
				Avg: "60",
				Subject: 1234,
			};
			dataset.addSection(section);
			expect(dataset.getSize()).to.equal(1);
		});

		it("Add a list of sections", function () {
			let sections = [
				{
					Title: "",
					id: "25945",
					Professor: "",
					Audit: 0,
					Year: 2013,
					Course: "100",
					Pass: 3,
					Fail: 0,
					Avg: 60,
					Subject: "test",
				},
				{
					Title: "yes",
					id: "25",
					Professor: "asd",
					Audit: 2,
					Year: 2022,
					Course: "101",
					Pass: 3,
					Fail: 0,
					Avg: 60,
					Subject: "else",
				},
			];

			dataset.addSections(sections);
			expect(dataset.getSize()).to.equal(2);
		});

		it("Add an incorrectly formatted object", function () {
			expect(function () {
				dataset.addSection({});
			}).to.throw(InsightError);
		});

		it("Add a section with a missing key", function () {
			let section = {
				Title: "",
				id: 25945,
				Professor: "",
				Audit: 0,
				Year: "2013",
				Course: "100",
				Pass: 3,
				Avg: 60,
				Subject: "test",
			};
			expect(function () {
				dataset.addSection(section);
			}).to.throw(InsightError);
		});

		it("Add a section with an mkey key of the wrong type", function () {
			let section = {
				Title: "",
				id: 25945,
				Professor: "",
				Audit: 0,
				Year: "2013",
				Course: "100",
				Pass: 3,
				Fail: 0,
				Avg: "no",
				Subject: "test",
			};
			expect(function () {
				dataset.addSection(section);
			}).to.throw(InsightError);
		});
	});
});
