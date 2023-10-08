import {InsightError} from "../../src/controller/IInsightFacade";
import Dataset from "../../src/models/Dataset";
import {expect, use} from "chai";
describe.only("Dataset", async function () {
	let dataset: Dataset;

	describe("addSection", async function () {
		beforeEach(function () {
			dataset = new Dataset("ubc");
		});

		it("Add an incorrectly formatted object should do nothing", function () {
			dataset.addSection({});

			expect(dataset.getSections()).to.be.empty;
			expect(dataset.getSize()).to.equal(0);
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

			expect(dataset.getSections()).to.have.lengthOf(1).and.have.deep.members([section]);
			expect(dataset.getSize()).to.equal(1);
		});

		it("Add a section where section == 'overall' so Year is replaced with 1900", function () {
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
				Section: "overall",
			};

			let expected = {
				Title: "",
				id: "25945",
				Professor: "",
				Audit: 0,
				Year: 1900,
				Course: "100",
				Pass: 3,
				Fail: 0,
				Avg: 60,
				Subject: "test",
			};

			dataset.addSection(section);

			expect(dataset.getSections()).to.have.lengthOf(1).and.have.deep.members([expected]);
			expect(dataset.getSize()).to.equal(1);
		});

		it("Add a section where section == 'overall' so Year is 1900", function () {
			let section = {
				Title: "",
				id: "25945",
				Professor: "",
				Audit: 0,
				Course: "100",
				Pass: 3,
				Fail: 0,
				Avg: 60,
				Subject: "test",
				Section: "overall",
			};

			let expected = {
				Title: "",
				id: "25945",
				Professor: "",
				Audit: 0,
				Year: 1900,
				Course: "100",
				Pass: 3,
				Fail: 0,
				Avg: 60,
				Subject: "test",
			};

			dataset.addSection(section);

			expect(dataset.getSections()).to.have.lengthOf(1).and.have.deep.members([expected]);
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

			let expected = {
				Title: "1234",
				id: "25945",
				Professor: "123",
				Audit: 0,
				Year: 2013,
				Course: "100",
				Pass: 3,
				Fail: 0,
				Avg: 60,
				Subject: "1234",
			};

			dataset.addSection(section);

			expect(dataset.getSections()).to.have.lengthOf(1).and.have.deep.members([expected]);
			expect(dataset.getSize()).to.equal(1);
		});

		it("Add a single section where inputs are incorrect types but can be parsed to correct types", function () {
			let section = {
				tier_eighty_five: 16,
				tier_ninety: 10,
				Title: "comptr security",
				Section: "101",
				Detail: "",
				tier_seventy_two: 4,
				Other: 0,
				Low: 57,
				tier_sixty_four: 3,
				id: 81239,
				tier_sixty_eight: 3,
				tier_zero: 0,
				tier_seventy_six: 13,
				tier_thirty: 0,
				tier_fifty: 0,
				Professor: "beznosov, konstantin",
				Audit: 0,
				tier_g_fifty: 0,
				tier_forty: 0,
				Withdrew: 0,
				Year: "2015",
				tier_twenty: 0,
				Stddev: 8.78,
				Enrolled: 68,
				tier_fifty_five: 2,
				tier_eighty: 16,
				tier_sixty: 1,
				tier_ten: 0,
				High: 98,
				Course: "442",
				Session: "w",
				Pass: 68,
				Fail: 0,
				Avg: 81.28,
				Campus: "ubc",
				Subject: "cpen",
			};

			let expected = {
				Title: "comptr security",
				id: "81239",
				Professor: "beznosov, konstantin",
				Audit: 0,
				Year: 2015,
				Course: "442",
				Pass: 68,
				Fail: 0,
				Avg: 81.28,
				Subject: "cpen",
			};

			dataset.addSection(section);

			expect(dataset.getSections()).to.have.lengthOf(1).and.have.deep.members([expected]);
			expect(dataset.getSize()).to.equal(1);
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

			dataset.addSection(section);

			expect(dataset.getSize()).to.equal(0);
			expect(dataset.getSections()).to.be.empty;
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

			dataset.addSection(section);

			expect(dataset.getSections()).to.be.empty;
			expect(dataset.getSize()).to.equal(0);
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
			expect(dataset.getSections()).to.have.lengthOf(2).and.deep.members(sections);
		});

		it("Add a list of invalid sections", function () {
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
					Subject: "test",
				},
				{
					Title: "yes",
					id: "25",
					Professor: "asd",
					Year: 2022,
					Course: "101",
					Pass: 3,
					Fail: 0,
					Avg: 60,
					Subject: "else",
				},
			];

			dataset.addSections(sections);

			expect(dataset.getSize()).to.equal(0);
			expect(dataset.getSections()).to.be.empty;
		});

		it("Add a list mixed with valid and invalid sections", function () {
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
					Subject: "test",
				},
				{
					Title: "yes",
					id: "25",
					Professor: "asd",
					Year: 2022,
					Course: "101",
					Pass: 3,
					Fail: 0,
					Avg: 60,
					Subject: "else",
				},
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

			let expected = [
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
			expect(dataset.getSections()).to.have.lengthOf(2).and.deep.members(expected);
		});
	});
});
