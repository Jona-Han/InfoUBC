import {expect} from "chai";
import {
	InsightDatasetKind,
	InsightError,
	InsightResult,
	ResultTooLargeError,
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";
import {clearDisk, getContentFromArchives} from "../TestUtil";
import {folderTest} from "@ubccpsc310/folder-test";

describe("performQuery", function () {
	let sections: string;
	let facade: InsightFacade;

	before(function () {
		sections = getContentFromArchives("10validcourses.zip");
	});

	beforeEach(function () {
		facade = new InsightFacade();
	});

	afterEach(function () {
		clearDisk();
	});

	context("null is passed in", function () {
		it("should fail with insightError with null WHERE and null OPTIONS passed in", async function () {
			try {
				await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
				await facade.performQuery({WHERE: null, OPTIONS: null});
				expect.fail("Error should have been thrown");
			} catch (error) {
				expect(error).to.be.an.instanceOf(InsightError);
			}
		});
	});
});

describe("All FolderTests for Queries", function () {
	let sections: string;
	let facade: InsightFacade;
	type Output = InsightResult[];
	type PQErrorKind = "InsightError" | "ResultTooLargeError";

	before(async function () {
		clearDisk();
		sections = getContentFromArchives("pair.zip");
		facade = new InsightFacade();
		try {
			await facade.addDataset("sections", sections, InsightDatasetKind.Sections);
		} catch {
			expect.fail("Failed to add sections dataset in folder-test");
		}
	});

	after(function () {
		console.info(`After: ${this.test?.parent?.title}`);
		clearDisk();
	});

	function errorValidator(error: unknown): error is PQErrorKind {
		return error === "InsightError" || error === "ResultTooLargeError";
	}

	// Assert actual error is of expected type
	function assertError(actual: unknown, expected: PQErrorKind): void {
		if (expected === "InsightError") {
			expect(actual).to.be.an.instanceOf(InsightError);
		} else if (expected === "ResultTooLargeError") {
			expect(actual).to.be.an.instanceOf(ResultTooLargeError);
		} else {
			expect.fail("Should not be reached in assertError");
		}
	}

	function target(input: unknown): Promise<Output> {
		return facade.performQuery(input);
	}

	describe("Dynamic folder test for unordered queries - sections", function () {
		// Assert value equals expected
		function assertResult(actual: unknown, expected: Output): void {
			expect(actual).to.have.deep.members(expected).and.have.lengthOf(expected.length);
		}

		folderTest<unknown, Output, PQErrorKind>(
			"performQuery unordered section tests", // suiteName
			target, // target
			"./test/resources/unordered_sections", // path
			{
				errorValidator,
				assertOnResult: assertResult,
				assertOnError: assertError, // options
			}
		);
	});

	describe("Dynamic folder test for ordered queries - sections", function () {
		// Assert value equals expected
		function assertResult(actual: unknown, expected: Output): void {
			expect(actual).to.deep.equal(expected);
		}

		folderTest<unknown, Output, PQErrorKind>(
			"performQuery ordered section tests", // suiteName
			target, // target
			"./test/resources/ordered_sections", // path
			{
				errorValidator,
				assertOnResult: assertResult,
				assertOnError: assertError, // options
			}
		);

		folderTest<unknown, Output, PQErrorKind>(
			"performQuery ordered section transformation tests", // suiteName
			target, // target
			"./test/resources/ordered_sections/transformations", // path
			{
				errorValidator,
				assertOnResult: assertResult,
				assertOnError: assertError, // options
			}
		);
	});

	describe("Dynamic folder test for unordered rooms queries", function () {
		before(async function () {
			clearDisk();
			let rooms = getContentFromArchives("campus.zip");
			facade = new InsightFacade();
			try {
				await facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
			} catch {
				expect.fail("Failed to add rooms in folder-test");
			}
		});

		// Assert value equals expected
		function assertResult(actual: unknown, expected: Output): void {
			expect(actual).to.have.deep.members(expected).and.have.lengthOf(expected.length);
		}

		folderTest<unknown, Output, PQErrorKind>(
			"performQuery unordered rooms tests", // suiteName
			target, // target
			"./test/resources/unordered_rooms", // path
			{
				errorValidator,
				assertOnResult: assertResult,
				assertOnError: assertError, // options
			}
		);
	});
});
