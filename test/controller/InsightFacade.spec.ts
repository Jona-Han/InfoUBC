import {expect, use} from "chai";
import chaiAsPromised from "chai-as-promised";
use(chaiAsPromised);

import {
	InsightError,
	InsightDatasetKind,
	NotFoundError,
	ResultTooLargeError,
	InsightResult,
	ResultTooLargeError,
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";
import {clearDisk, getContentFromArchives} from "../resources/archives/testUtil";
import {folderTest} from "@ubccpsc310/folder-test";

describe("InsightFacade", async function () {
	let sections: string;
	let facade: InsightFacade;

	before(function () {
		sections = getContentFromArchives("10validcourses.zip");
	});

	beforeEach(function () {
		clearDisk();
		facade = new InsightFacade();
	});

	describe("addDataset", function () {
		context("free mutant", function () {
			it("should reject with an empty dataset id", function () {
				const result = facade.addDataset("", sections, InsightDatasetKind.Sections);

				return expect(result).to.eventually.be.rejectedWith(InsightError);
			});
		});

		context("when id contains an underscore", function () {
			it("should reject with an InsightError for underscore in id", function () {
				const result = facade.addDataset("invalid_id", sections, InsightDatasetKind.Sections);
				return expect(result).to.eventually.be.rejectedWith(InsightError);
			});
		});

		context("when id is only whitespace characters", function () {
			it("should reject with an InsightError for whitespace in id", function () {
				const result = facade.addDataset("    ", sections, InsightDatasetKind.Sections);
				return expect(result).to.eventually.be.rejectedWith(InsightError);
			});
		});

		context("when id already exists", function () {
			it("should reject with an InsightError for existingID", async function () {
				try {
					const firstCall = await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
					expect(firstCall).to.have.members(["ubc"]);

					await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
					expect.fail("Should have thrown an error");
				} catch (error) {
					expect(error).to.be.instanceOf(InsightError);
				}
			});
		});

		context("when dataset content is empty", function () {
			it("should reject with an InsightError for empty content", function () {
				const result = facade.addDataset("validId", "", InsightDatasetKind.Sections);
				return expect(result).to.eventually.be.rejectedWith(InsightError);
			});
		});

		context("when both id and content are empty", function () {
			it("should reject with an InsightError for both empty", function () {
				const result = facade.addDataset("", "", InsightDatasetKind.Sections);
				return expect(result).to.eventually.be.rejectedWith(InsightError);
			});
		});

		context("when dataset content is not base64", function () {
			it("should reject with an InsightError for nonBase64", function () {
				const result = facade.addDataset(
					"validId",
					"nonBase64_Content",
					InsightDatasetKind.Sections
				);
				return expect(result).to.eventually.be.rejectedWith(InsightError);
			});
		});

		context("when dataset content is not a zip file", function () {
			it("should reject with an InsightError for not a zip file", function () {
				let txtFile = getContentFromArchives("notAZip.txt");

				const result = facade.addDataset("validId", txtFile, InsightDatasetKind.Sections);
				return expect(result).to.eventually.be.rejectedWith(InsightError);
			});
		});

		context("when dataset content contains no valid sections", function () {
			it("should reject with an InsightError for no valid sections", function () {
				let invalidDataset = getContentFromArchives("noValidSections.zip");

				const result = facade.addDataset("validId", invalidDataset, InsightDatasetKind.Sections);
				return expect(result).to.eventually.be.rejectedWith(InsightError);
			});
		});

		afterEach(function () {
			// This section resets the data directory (removing any cached data)
			// This runs after each test, which should make each test independent of the previous one
			console.info(`AfterTest: ${this.currentTest?.title}`);
			clearDisk();
		});

		// This is a unit test. You should create more like this!
		it("should reject with  an empty dataset id", function () {
			const result = facade.addDataset("", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});
	});

		context("when adding many sections", function () {
			it("should successfully add 64612 sections", async function () {
				try {
					const zip = getContentFromArchives("pair.zip");
					const add = await facade.addDataset("ubc", zip, InsightDatasetKind.Sections);
					const list = await facade.listDatasets();
					const remove = await facade.removeDataset("ubc");

					expect(add).to.include.members(["ubc"]);
					expect(list).to.deep.include({
						id: "ubc",
						kind: InsightDatasetKind.Sections,
						numRows: 64612,
					});
					expect(remove).to.equal("ubc");
				} catch (error) {
					expect.fail("Error not expected");
				}
			});
		});
	});

	describe("crashTesting", function () {
		context("when adding one dataset and then crashing", function () {
			it("should crash and return the proper insightDataset", async function () {
				const oneSection = getContentFromArchives("only1section.zip");
				await facade.addDataset("ubc", oneSection, InsightDatasetKind.Sections);

        // simulate crash
				const newFacade: InsightFacade = new InsightFacade();

        // recover
				const result = newFacade.listDatasets();
				return expect(result).to.eventually.deep.include({
					id: "ubc",
					kind: InsightDatasetKind.Sections,
					numRows: 1,
				});
			});
		});

		context("when adding one dataset and then crashing and adding another", async function () {
			it("should crash and return both proper insightDatasets", async function () {
				try {
					const oneSection = getContentFromArchives("only1section.zip");
					const threeSection = getContentFromArchives("3validsections.zip");
					await facade.addDataset("ubc", oneSection, InsightDatasetKind.Sections);

          // simulate crash
					const newFacade: InsightFacade = new InsightFacade();

          // recover
					await facade.addDataset("new", threeSection, InsightDatasetKind.Sections);
					const result = await newFacade.listDatasets();

					expect(result).to.deep.include.members([
						{
							id: "ubc",
							kind: InsightDatasetKind.Sections,
							numRows: 1,
						},
						{
							id: "new",
							kind: InsightDatasetKind.Sections,
							numRows: 3,
						},
					]);
				} catch (error) {
					expect.fail("Error not expected");
				}
			});
		});

		context("when adding one dataset and then crashing and removing", function () {
			it("should crash and be able to remove", async function () {
				try {
					const oneSection = getContentFromArchives("only1section.zip");
					await facade.addDataset("ubc", oneSection, InsightDatasetKind.Sections);

          // simulate crash
					const newFacade: InsightFacade = new InsightFacade();

          // recover
					const result = await newFacade.removeDataset("ubc");

					expect(result).to.equal("ubc");
				} catch (error) {
					expect.fail("Error not expected");
				}
			});
		});

		context("when adding one dataset and then crashing and performQuery", function () {
			it("should crash and be able to perform the query", async function () {
				try {
					const pair = getContentFromArchives("pair.zip");
					await facade.addDataset("ubc", pair, InsightDatasetKind.Sections);

          // simulate crash
					const newFacade: InsightFacade = new InsightFacade();

			// Load the datasets specified in datasetsToQuery and add them to InsightFacade.
			// Will *fail* if there is a problem reading ANY dataset.
			const loadDatasetPromises = [facade.addDataset("sections", sections, InsightDatasetKind.Sections)];

			return Promise.all(loadDatasetPromises);
                } catch {
                    
                }
		});

		after(function () {
			console.info(`After: ${this.test?.parent?.title}`);
			clearDisk();
		});

		type PQErrorKind = "ResultTooLargeError" | "InsightError";

		folderTest<unknown, Promise<InsightResult[]>, PQErrorKind>(
			"Dynamic InsightFacade PerformQuery tests",
			(input) => facade.performQuery(input),
			"./test/resources/queries",
			{
				assertOnResult: (actual, expected) => {
					// TODO add an assertion!
				},
				errorValidator: (error): error is PQErrorKind =>
					error === "ResultTooLargeError" || error === "InsightError",
				assertOnError: (actual, expected) => {
					// TODO add an assertion!
				},
			}
		);
	});
});

describe("Dynamic folder test", function () {
  type Output = InsightResult[];
  type PQErrorKind = "ResultTooLargeError" | "InsightError";
  let sections: string;
  let facade: InsightFacade;

  before(async function () {
  	sections = getContentFromArchives("pair.zip");
  	facade = new InsightFacade();
  	await facade.addDataset("sections", sections, InsightDatasetKind.Sections);
  });

  // Assert value equals expected
  function assertResult(actual: unknown, expected: Output): void {
  	expect(actual).to.have.deep.members(expected);
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

  folderTest<unknown, Output, PQErrorKind>(
  	"performQuery tests", // suiteName
  	target, // target
  	"./test/resources/queries", // path
  	{
  		assertOnResult: assertResult,
  		assertOnError: assertError, // options
  		errorValidator: (error): error is PQErrorKind =>
  			error === "ResultTooLargeError" || error === "InsightError",
  	}
  );
});
