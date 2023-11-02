import {expect, use} from "chai";
import chaiAsPromised from "chai-as-promised";
use(chaiAsPromised);

import {
	InsightError,
	InsightDatasetKind,
	NotFoundError,
	ResultTooLargeError,
	InsightResult,
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";
import {clearDisk, getContentFromArchives} from "../resources/archives/testUtil";
import {folderTest} from "@ubccpsc310/folder-test";

describe("InsightFacade", async function () {
	let sections: string;
	let rooms: string;
	let facade: InsightFacade;

	before(function () {
		sections = getContentFromArchives("10validcourses.zip");
		rooms = getContentFromArchives("1ValidBuilding.zip");
	});

	beforeEach(function () {
		facade = new InsightFacade();
	});

	afterEach(function () {
		clearDisk();
	});

	describe("addDataset", function () {
		context("free mutant", function () {
			it("should reject with an empty dataset id", async function () {
				const result = facade.addDataset("", sections, InsightDatasetKind.Sections);
				const result2 = facade.addDataset("", rooms, InsightDatasetKind.Rooms);

				await expect(result).to.eventually.be.rejectedWith(InsightError);
				return expect(result2).to.eventually.be.rejectedWith(InsightError);
			});
		});

		context("when id contains an underscore", function () {
			it("should reject with an InsightError for underscore in id", async function () {
				const result = facade.addDataset("invalid_id", sections, InsightDatasetKind.Sections);
				const result2 = facade.addDataset("invalid_id", rooms, InsightDatasetKind.Rooms);

				await expect(result).to.eventually.be.rejectedWith(InsightError);
				return expect(result).to.eventually.be.rejectedWith(InsightError);
			});
		});

		context("when id is only whitespace characters", function () {
			it("should reject with an InsightError for whitespace in id", async function () {
				const result = facade.addDataset("    ", sections, InsightDatasetKind.Sections);
				const result2 = facade.addDataset("       ", rooms, InsightDatasetKind.Rooms);

				await expect(result).to.eventually.be.rejectedWith(InsightError);
				return expect(result).to.eventually.be.rejectedWith(InsightError);
			});
		});

		context("when id already exists", function () {
			it("should reject with an InsightError for existingID", async function () {
				try {
					const firstCall = await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
					expect(firstCall).to.have.members(["ubc"]);

					const secondCall = await facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
					expect(secondCall).to.have.members(["rooms", "ubc"]);

					let result = facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
					let result2 = facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
					let result3 = facade.addDataset("ubc", rooms, InsightDatasetKind.Rooms);
					let result4 = facade.addDataset("rooms", sections, InsightDatasetKind.Sections);

					await expect(result).to.eventually.rejectedWith(InsightError);
					await expect(result2).to.eventually.rejectedWith(InsightError);
					await expect(result3).to.eventually.rejectedWith(InsightError);
					await expect(result4).to.eventually.rejectedWith(InsightError);
				} catch (error) {
					return expect.fail("Incorrect error thrown:" + error);
				}
			});
		});

		context("when dataset content is empty", function () {
			it("should reject with an InsightError for empty content", async function () {
				const result = facade.addDataset("validId", "", InsightDatasetKind.Sections);
				const result2 = facade.addDataset("validId2", "", InsightDatasetKind.Rooms);

				await expect(result).to.eventually.be.rejectedWith(InsightError);
				return expect(result2).to.eventually.be.rejectedWith(InsightError);
			});
		});

		context("when both id and content are empty", function () {
			it("should reject with an InsightError for both empty", async function () {
				const result = facade.addDataset("", "", InsightDatasetKind.Sections);
				const result2 = facade.addDataset("", "", InsightDatasetKind.Rooms);

				await expect(result2).to.eventually.be.rejectedWith(InsightError);
				return expect(result).to.eventually.be.rejectedWith(InsightError);
			});
		});

		context("when dataset content is not base64", function () {
			it("should reject with an InsightError for nonBase64", async function () {
				const result = facade.addDataset("validId", "nonBase64_Content", InsightDatasetKind.Sections);
				const result2 = facade.addDataset("validId", "nonBase64_Content2", InsightDatasetKind.Rooms);
				await expect(result2).to.eventually.be.rejectedWith(InsightError);
				return expect(result).to.eventually.be.rejectedWith(InsightError);
			});
		});

		context("when dataset content is not a zip file", function () {
			it("should reject with an InsightError for not a zip file", async function () {
				let txtFile = getContentFromArchives("notAZip.txt");
				// let campus = getContentFromArchives("campus/")

				const result = facade.addDataset("validId", txtFile, InsightDatasetKind.Sections);
				const result2 = facade.addDataset("validId", txtFile, InsightDatasetKind.Rooms);
				await expect(result2).to.eventually.be.rejectedWith(InsightError);
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

		context("when dataset content has only empty JSON file", function () {
			it("should reject with an InsightError for course is not JSON file", function () {
				let invalidDataset = getContentFromArchives("courseNotJSON.zip");

				const result = facade.addDataset("validId", invalidDataset, InsightDatasetKind.Sections);
				return expect(result).to.eventually.be.rejectedWith(InsightError);
			});
		});

		context("when dataset content has no courses", function () {
			it("should reject with an InsightError for empty courses directory", function () {
				let invalidDataset = getContentFromArchives("noCourses.zip");

				const result = facade.addDataset("validId", invalidDataset, InsightDatasetKind.Sections);
				return expect(result).to.eventually.be.rejectedWith(InsightError);
			});
		});

		context("when courses directory only has one invalid course", function () {
			it("should reject with an InsightError for no valid courses", function () {
				let invalidDataset = getContentFromArchives("blankJSON.zip");

				const result = facade.addDataset("validId", invalidDataset, InsightDatasetKind.Sections);
				return expect(result).to.eventually.be.rejectedWith(InsightError);
			});
		});

		context("when each section is missing a different field", function () {
			it("should reject with an InsightError for missing fields", function () {
				let invalidDataset = getContentFromArchives("missingFields.zip");

				const result = facade.addDataset("validId", invalidDataset, InsightDatasetKind.Sections);
				return expect(result).to.eventually.be.rejectedWith(InsightError);
			});
		});

		context("when content courses are put in the wrong directory name", function () {
			it("should reject with an InsightError for wrong directory name", function () {
				let invalidDataset = getContentFromArchives("wrongInnerFolder.zip");

				const result = facade.addDataset("validId", invalidDataset, InsightDatasetKind.Sections);
				return expect(result).to.eventually.be.rejectedWith(InsightError);
			});
		});

		context("when trying to add a rooms dataset as kind = Sections and vice versa", function () {
			it("should reject with an InsightError unable to parse", async function () {
				const result = facade.addDataset("validId", rooms, InsightDatasetKind.Sections);
				const result2 = facade.addDataset("validId", sections, InsightDatasetKind.Rooms);
				await expect(result2).to.eventually.be.rejectedWith(InsightError);
				return expect(result).to.eventually.be.rejectedWith(InsightError);
			});
		});

		context("when adding a valid section dataset", function () {
			it("should successfully add a sections dataset", function () {
				try {
					const result = facade.addDataset("ubc", sections, InsightDatasetKind.Sections);

					return expect(result).to.eventually.have.lengthOf(1).and.include.members(["ubc"]);
				} catch (error) {
					expect.fail("Unexpected error: " + error);
				}
			});
		});

		context("when adding a valid rooms dataset", function () {
			it("should successfully add a rooms dataset", function () {
				try {
					const result = facade.addDataset("ubc", rooms, InsightDatasetKind.Rooms);

					return expect(result).to.eventually.have.lengthOf(1).and.include.members(["ubc"]);
				} catch (error) {
					expect.fail("unexpected error: " + error);
				}
			});
		});

		context(
			"when adding a rooms dataset with 1 room and all fields empty except capacity and address",
			function () {
				it("should successfully add this rooms dataset dataset", function () {
					try {
						const valid = getContentFromArchives("addressAndCapacityNotBlank.zip");
						const result = facade.addDataset("ubc", valid, InsightDatasetKind.Rooms);

						return expect(result).to.eventually.have.lengthOf(1).and.include.members(["ubc"]);
					} catch (error) {
						expect.fail("unexpected error thrown: " + error);
					}
				});
			}
		);

		context("when adding a rooms dataset with 1 room and all blank fields except address", function () {
			it("should reject with insight error since capacity needs to be number", function () {
				const valid = getContentFromArchives("roomCapacityNotANumber.zip");
				const result = facade.addDataset("ubc", valid, InsightDatasetKind.Rooms);

				return expect(result).to.eventually.rejectedWith(InsightError);
			});
		});

		context("when adding a rooms dataset with no linke to building file", function () {
			it("should reject with insighno valid roomst error since the building file cannot be reached", function () {
				const valid = getContentFromArchives("noHrefInIndex.zip");
				const result = facade.addDataset("ubc", valid, InsightDatasetKind.Rooms);

				return expect(result).to.eventually.rejectedWith(InsightError);
			});
		});

		context("when adding a rooms dataset with 1 room and all blank fields except address", function () {
			it("should reject with insight error since capacity cannot be converte to number", function () {
				const valid = getContentFromArchives("destinationFolderWithNoClassrooms.zip");
				const result = facade.addDataset("ubc", valid, InsightDatasetKind.Rooms);

				return expect(result).to.eventually.rejectedWith(InsightError);
			});
		});

		context("when adding a rooms dataset with an empty index file", function () {
			it("should reject with insight error since no index file", function () {
				const valid = getContentFromArchives("emptyIndex.zip");
				const result = facade.addDataset("ubc", valid, InsightDatasetKind.Rooms);

				return expect(result).to.eventually.rejectedWith(InsightError);
			});
		});

		context("when adding a rooms dataset with incorrect file format", function () {
			it("all should reject with incorrect file formats", async function () {
				try {
					const valid = getContentFromArchives("emptyIndex.zip");
					const valid2 = getContentFromArchives("emptyTableBody.zip");
					const valid3 = getContentFromArchives("noIndex.zip");
					const valid4 = getContentFromArchives("noTableInRoomFile.zip");

					const result = facade.addDataset("ubc", valid, InsightDatasetKind.Rooms);
					const result2 = facade.addDataset("ubc2", valid2, InsightDatasetKind.Rooms);
					const result3 = facade.addDataset("ubc3", valid3, InsightDatasetKind.Rooms);
					const result4 = facade.addDataset("ubc4", valid4, InsightDatasetKind.Rooms);

					await expect(result).to.eventually.rejectedWith(InsightError);
					await expect(result2).to.eventually.rejectedWith(InsightError);
					await expect(result3).to.eventually.rejectedWith(InsightError);
					return expect(result4).to.eventually.rejectedWith(InsightError);
				} catch (e) {
					expect.fail(e + " unexpected");
				}
			});
		});

		context("when adding a rooms dataset with a missing field", function () {
			it("all should reject with midding fileds", async function () {
				const contents = [
					getContentFromArchives("missingBuildingName.zip"),
					getContentFromArchives("missingBuildingShortName.zip"),
					getContentFromArchives("missingAddress.zip"),
					getContentFromArchives("missingCapacity.zip"),
					getContentFromArchives("missingRoomFurniture.zip"),
					getContentFromArchives("missingRoomHref.zip"),
					getContentFromArchives("missingRoomNumber.zip"),
					getContentFromArchives("missingRoomType.zip"),
				];
				try {
					const result = facade.addDataset("ubc", contents[0], InsightDatasetKind.Rooms);
					await expect(result).to.eventually.be.rejectedWith(InsightError);

					const result2 = facade.addDataset("ubc", contents[1], InsightDatasetKind.Rooms);
					await expect(result2).to.eventually.be.rejectedWith(InsightError);

					const result3 = facade.addDataset("ubc", contents[2], InsightDatasetKind.Rooms);
					await expect(result3).to.eventually.be.rejectedWith(InsightError);

					const result4 = facade.addDataset("ubc", contents[3], InsightDatasetKind.Rooms);
					await expect(result4).to.eventually.be.rejectedWith(InsightError);

					const result5 = facade.addDataset("ubc", contents[4], InsightDatasetKind.Rooms);
					await expect(result5).to.eventually.be.rejectedWith(InsightError);

					const result6 = facade.addDataset("ubc", contents[5], InsightDatasetKind.Rooms);
					await expect(result6).to.eventually.be.rejectedWith(InsightError);

					const result7 = facade.addDataset("ubc", contents[6], InsightDatasetKind.Rooms);
					await expect(result7).to.eventually.be.rejectedWith(InsightError);

					const result8 = facade.addDataset("ubc", contents[7], InsightDatasetKind.Rooms);
					await expect(result8).to.eventually.be.rejectedWith(InsightError);
				} catch (e) {
					expect.fail(e + " error unxepect");
				}
			});
		});

		context("when adding a dataset with result key named wrong", function () {
			it("should thrown an error for no valid courses", function () {
				const invalidSection = getContentFromArchives("notNamedResult.zip");

				const result = facade.addDataset("ubc", invalidSection, InsightDatasetKind.Sections);

				return expect(result).to.eventually.be.rejectedWith(InsightError);
			});
		});

		context("when adding a dataset with all keys as strings that can't be numbers", function () {
			it("should thrown an error for no valid courses also", function () {
				const invalidSection = getContentFromArchives("allKeysAreStringsThatArentNumbers.zip");

				const result = facade.addDataset("ubc", invalidSection, InsightDatasetKind.Sections);

				return expect(result).to.eventually.be.rejectedWith(InsightError);
			});
		});

		context("when adding a dataset with a section missing fields but includes other valid sections", function () {
			it("should successfully add a dataset with the valid sections only", function () {
				const validSection = getContentFromArchives("missingFieldsOtherValidSection.zip");
				const result = facade.addDataset("ubc", validSection, InsightDatasetKind.Sections);

				return expect(result).to.eventually.have.lengthOf(1).and.include.members(["ubc"]);
			});
		});

		context("when adding a dataset with more than one table, but only one is valid", function () {
			it("should successfully add a dataset with the valid rooms only", function () {
				const validSection = getContentFromArchives("twoTablesOneValid.zip");
				const result = facade.addDataset("ubc", validSection, InsightDatasetKind.Rooms);

				return expect(result).to.eventually.have.lengthOf(1).and.include.members(["ubc"]);
			});
		});

		context("when adding a course that is a PDF", function () {
			it("should return for a PDF course insightError", function () {
				const validSection = getContentFromArchives("courseIsAPDF.zip");
				const result = facade.addDataset("ubc", validSection, InsightDatasetKind.Sections);

				return expect(result).to.eventually.be.rejectedWith(InsightError);
			});
		});

		context("when adding a course that is a txt", function () {
			it("should return add course correctly", function () {
				const validSection = getContentFromArchives("courseIsATxt.zip");
				const result = facade.addDataset("ubc", validSection, InsightDatasetKind.Sections);

				return expect(result).to.eventually.have.lengthOf(1).and.have.deep.members(["ubc"]);
			});
		});

		context("when adding a course with an invalid address", function () {
			it("should reject with Insight error", function () {
				const validSection = getContentFromArchives("invalidAddress.zip");
				const result = facade.addDataset("ubc", validSection, InsightDatasetKind.Sections);

				return expect(result).to.eventually.be.rejectedWith(InsightError);
			});
		});

		context("when adding a course that is a JSON", function () {
			it("should successfully add course if it correct format", function () {
				const validSection = getContentFromArchives("courseIsAJSON.zip");
				const result = facade.addDataset("ubc", validSection, InsightDatasetKind.Sections);

				return expect(result).to.eventually.have.lengthOf(1).and.have.members(["ubc"]);
			});
		});

		context("when adding a dataset with all keys as numbers", function () {
			it("should successfully add a dataset but convert skeys to strings", function () {
				const validSection = getContentFromArchives("allRequiredKeysAreNumbers.zip");
				const result = facade.addDataset("ubc", validSection, InsightDatasetKind.Sections);

				return expect(result).to.eventually.have.lengthOf(1).and.include.members(["ubc"]);
			});
		});

		context("when adding a dataset with all keys as strings that can convert to numbers", function () {
			it("should successfully add a dataset but convert all mkeys to numbers", function () {
				const validSection = getContentFromArchives("allKeysAreStringsThatCanBeNumbers.zip");
				const result = facade.addDataset("ubc", validSection, InsightDatasetKind.Sections);

				return expect(result).to.eventually.have.lengthOf(1).and.include.members(["ubc"]);
			});
		});

		context("when adding multiple valid datasets", function () {
			it("should successfully add each dataset in series", function () {
				const secondSection = getContentFromArchives("only1section.zip");
				const thirdSection = getContentFromArchives("3validsections.zip");

				const result = facade
					.addDataset("first", sections, InsightDatasetKind.Sections)
					.then(() => facade.addDataset("second", secondSection, InsightDatasetKind.Sections))
					.then(() => facade.addDataset("third", thirdSection, InsightDatasetKind.Sections));

				return expect(result).to.eventually.have.lengthOf(3).and.include.members(["second", "third", "first"]);
			});
		});

		context("when adding many sections", function () {
			it("should successfully add 64612 sections", async function () {
				try {
					const zip = getContentFromArchives("pair.zip");
					const add = await facade.addDataset("ubc", zip, InsightDatasetKind.Sections);
					const list = await facade.listDatasets();
					const remove = await facade.removeDataset("ubc");
					const list2 = await facade.listDatasets();

					expect(add).to.have.lengthOf(1).and.include.members(["ubc"]);
					expect(list).to.have.lengthOf(1).and.deep.include({
						id: "ubc",
						kind: InsightDatasetKind.Sections,
						numRows: 64612,
					});
					expect(remove).to.equal("ubc");
					expect(list2).to.be.empty;
				} catch (error) {
					expect.fail("Error not expected");
				}
			});
		});

		context("when adding many rooms", function () {
			it("should successfully add 364 rooms", async function () {
				try {
					const zip = getContentFromArchives("campus.zip");
					const add = await facade.addDataset("rooms", zip, InsightDatasetKind.Rooms);
					const list = await facade.listDatasets();
					// const remove = await facade.removeDataset("rooms");
					// const list2 = await facade.listDatasets();

					expect(add).to.have.lengthOf(1).and.include.members(["rooms"]);
					expect(list).to.have.lengthOf(1).and.deep.include({
						id: "rooms",
						kind: InsightDatasetKind.Rooms,
						numRows: 364,
					});
					// expect(remove).to.equal("rooms");
					// expect(list2).to.be.empty;
				} catch {
					expect.fail("Error not exepcted");
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
					const result = newFacade.listDatasets();

					return expect(result).to.eventually.deep.include.members([
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
					const result = newFacade.removeDataset("ubc");

					return expect(result).to.eventually.equal("ubc");
				} catch (error) {
					expect.fail("Error not expected" + error);
				}
			});
		});

		context("Adding then removing datasets with various crashes inbetween", function () {
			it("should return correct sets", async function () {
				const oneSection = getContentFromArchives("only1section.zip");
				await facade.addDataset("one", oneSection, InsightDatasetKind.Sections);

				const threeSection = getContentFromArchives("3validsections.zip");
				await facade.addDataset("three", threeSection, InsightDatasetKind.Sections);

				const ubc = getContentFromArchives("pair.zip");
				await facade.addDataset("ubc", ubc, InsightDatasetKind.Sections);

				// simulate crash
				const newFacade: InsightFacade = new InsightFacade();

				// recover
				const result = newFacade.listDatasets();

				await expect(result)
					.to.eventually.include.deep.members([
						{
							id: "one",
							kind: InsightDatasetKind.Sections,
							numRows: 1,
						},
						{
							id: "three",
							kind: InsightDatasetKind.Sections,
							numRows: 3,
						},
						{
							id: "ubc",
							kind: InsightDatasetKind.Sections,
							numRows: 64612,
						},
					])
					.and.have.lengthOf(3);

				await newFacade.removeDataset("one");

				const newFacade2: InsightFacade = new InsightFacade();

				const result2 = newFacade2.listDatasets();

				await expect(result2)
					.to.eventually.include.deep.members([
						{
							id: "three",
							kind: InsightDatasetKind.Sections,
							numRows: 3,
						},
						{
							id: "ubc",
							kind: InsightDatasetKind.Sections,
							numRows: 64612,
						},
					])
					.and.have.lengthOf(2);

				const result3 = newFacade.removeDataset("ubc");

				await expect(result3).to.eventually.equal("ubc");

				const newFacade3: InsightFacade = new InsightFacade();

				const result4 = newFacade3.listDatasets();

				await expect(result4)
					.to.eventually.include.deep.members([
						{
							id: "three",
							kind: InsightDatasetKind.Sections,
							numRows: 3,
						},
					])
					.and.have.lengthOf(1);

				const result5 = newFacade.addDataset("one", oneSection, InsightDatasetKind.Sections);

				await expect(result5).to.eventually.have.deep.members(["one", "three"]).and.lengthOf(2);
			});
		});

		context("when adding one dataset and then crashing and performQuery", function () {
			it("should crash and be able to perform the query", async function () {
				try {
					const pair = getContentFromArchives("pair.zip");
					await facade.addDataset("sections", pair, InsightDatasetKind.Sections);

					// simulate crash
					const newFacade: InsightFacade = new InsightFacade();

					const query = {
						WHERE: {
							LT: {
								sections_avg: 20,
							},
						},
						OPTIONS: {
							COLUMNS: ["sections_dept", "sections_avg"],
							ORDER: "sections_avg",
						},
					};
					// recover
					const result = await newFacade.performQuery(query);

					const expected = [
						{
							sections_dept: "frst",
							sections_avg: 0,
						},
						{
							sections_dept: "lfs",
							sections_avg: 0,
						},
						{
							sections_dept: "lfs",
							sections_avg: 0,
						},
						{
							sections_dept: "wood",
							sections_avg: 1,
						},
						{
							sections_dept: "busi",
							sections_avg: 4,
						},
						{
							sections_dept: "busi",
							sections_avg: 4,
						},
						{
							sections_dept: "fopr",
							sections_avg: 4.5,
						},
					];

					expect(result).to.have.deep.members(expected);
				} catch (error) {
					expect.fail("Error not expected");
				}
			});
		});
	});

	describe("listDataset", function () {
		context("when no datasets have been added", function () {
			it("should return an empty array with no datasets", function () {
				const result = facade.listDatasets();
				return expect(result).to.eventually.deep.equal([]);
			});
		});

		context("when one dataset has been added", function () {
			it("should return one datasetInsight", function () {
				const oneSection = getContentFromArchives("only1section.zip");
				const result = facade
					.addDataset("ubc", oneSection, InsightDatasetKind.Sections)
					.then(() => facade.listDatasets());
				return expect(result)
					.to.eventually.have.lengthOf(1)
					.include.deep.members([
						{
							id: "ubc",
							kind: InsightDatasetKind.Sections,
							numRows: 1,
						},
					]);
			});
		});

		context("when multiple datasets have been successfully added in series", function () {
			it("should resolve and return 2 datasetInsights", function () {
				const firstSection = getContentFromArchives("only1section.zip");
				const secondSection = getContentFromArchives("3validsections.zip");
				const result = facade
					.addDataset("first", firstSection, InsightDatasetKind.Sections)
					.then(() => facade.addDataset("second", secondSection, InsightDatasetKind.Sections))
					.then(() => facade.listDatasets());

				return expect(result)
					.to.eventually.have.lengthOf(2)
					.and.include.deep.members([
						{
							id: "first",
							kind: InsightDatasetKind.Sections,
							numRows: 1,
						},
						{
							id: "second",
							kind: InsightDatasetKind.Sections,
							numRows: 3,
						},
					]);
			});
		});

		context("when multiple of the same dataset are added", function () {
			it("should resolve and return 2 datasetInsights of the same ", function () {
				const firstSection = getContentFromArchives("only1section.zip");
				const result = facade
					.addDataset("first", firstSection, InsightDatasetKind.Sections)
					.then(() => facade.addDataset("second", firstSection, InsightDatasetKind.Sections))
					.then(() => facade.listDatasets());

				return expect(result)
					.to.eventually.have.lengthOf(2)
					.and.include.deep.members([
						{
							id: "first",
							kind: InsightDatasetKind.Sections,
							numRows: 1,
						},
						{
							id: "second",
							kind: InsightDatasetKind.Sections,
							numRows: 1,
						},
					]);
			});
		});
	});

	describe("removeDataset", function () {
		context("when no datasets have been added", function () {
			it("should fail with notFoundError for no datasets added", function () {
				const result = facade.removeDataset("validId");
				return expect(result).to.eventually.be.rejectedWith(NotFoundError);
			});
		});

		describe("require a dataset to already be added", function () {
			context("after adding one dataset", function () {
				it("removeData should fulfill with the id of the dataset that was removed", function () {
					const result = facade
						.addDataset("ubc", sections, InsightDatasetKind.Sections)
						.then(() => facade.removeDataset("ubc"));
					return expect(result).to.eventually.equal("ubc");
				});

				it("listData should fulfill with an empty array", function () {
					const result = facade
						.addDataset("ubc", sections, InsightDatasetKind.Sections)
						.then(() => facade.removeDataset("ubc"))
						.then(() => facade.listDatasets());
					return expect(result).to.eventually.be.empty;
				});
			});
		});

		context("remove a dataset twice", function () {
			it("should fail after the second remove", function () {
				const result = facade
					.addDataset("ubc", sections, InsightDatasetKind.Sections)
					.then(() => facade.removeDataset("ubc"))
					.then(() => facade.removeDataset("ubc"));

				return expect(result).to.eventually.be.rejectedWith(NotFoundError);
			});
		});

		context("add a dataset again after a successful remove", function () {
			it("Should be successful", async function () {
				await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
				await facade.removeDataset("ubc");
				const result = facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
				await expect(result).to.eventually.have.lengthOf(1).and.include.members(["ubc"]);
				const result2 = facade.listDatasets();
				await expect(result2)
					.to.eventually.have.lengthOf(1)
					.and.deep.include.members([{id: "ubc", kind: "sections", numRows: 907}]);
			});
		});

		context("id is empty", function () {
			it("removeData should reject with InsightError for empty id", function () {
				const result = facade
					.addDataset("ubc", sections, InsightDatasetKind.Sections)
					.then(() => facade.removeDataset(""));
				return expect(result).to.eventually.be.rejectedWith(InsightError);
			});
		});

		context("when id contains an underscore", function () {
			it("removeData should reject with an InsightError for an underscore in id", function () {
				const result = facade
					.addDataset("ubc", sections, InsightDatasetKind.Sections)
					.then(() => facade.removeDataset("invalid_id"));
				return expect(result).to.eventually.be.rejectedWith(InsightError);
			});
		});

		context("when id is only whitespace characters", function () {
			it("removeData should reject with an InsightError for whitespace in id", function () {
				const result = facade
					.addDataset("ubc", sections, InsightDatasetKind.Sections)
					.then(() => facade.removeDataset("    "));
				return expect(result).to.eventually.be.rejectedWith(InsightError);
			});
		});

		context("when id has not been added yet", function () {
			it("removeData should reject with a NotFoundError for data not yet added", function () {
				const result = facade
					.addDataset("ubc", sections, InsightDatasetKind.Sections)
					.then(() => facade.removeDataset("otherValid"));
				return expect(result).to.eventually.be.rejectedWith(NotFoundError);
			});
		});

		context("when you remove multiple datasets", function () {
			it("should remove all added datasets", async function () {
				await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
				await facade.addDataset("U of BC", sections, InsightDatasetKind.Sections);
				await facade.addDataset("University", sections, InsightDatasetKind.Sections);

				const result = facade.removeDataset("U of BC");

				await expect(result).to.eventually.equal("U of BC");

				const result2 = facade.removeDataset("ubc");

				await expect(result2).to.eventually.equal("ubc");

				const result3 = facade.removeDataset("University");

				return expect(result3).to.eventually.equal("University");
			});
		});
	});

	describe("performQuery", function () {
		context("a string is passed in", function () {
			it("should fail with insightError with a string with performQuery", async function () {
				try {
					await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
					await facade.performQuery("");
					expect.fail("Error should have been thrown");
				} catch (error) {
					expect(error).to.be.an.instanceOf(InsightError);
				}
			});
		});

		context("no datasets have been added", function () {
			it("should fail with an insighterror because the referenced dataset has not been added", function () {
				const query = {
					WHERE: {
						LT: {
							sections_avg: 20,
						},
					},
					OPTIONS: {
						COLUMNS: ["sections_dept", "sections_avg"],
						ORDER: "sections_avg",
					},
				};
				const result = facade.performQuery(query);
				return expect(result).to.eventually.be.rejectedWith(InsightError);
			});
		});
	});
});

describe("Dynamic folder test for unordered queries", function () {
	type Output = InsightResult[];
	type PQErrorKind = "InsightError" | "ResultTooLargeError";
	let sections: string;
	let facade: InsightFacade;

	before(async function () {
		clearDisk();
		sections = getContentFromArchives("pair.zip");
		facade = new InsightFacade();
		await facade.addDataset("sections", sections, InsightDatasetKind.Sections);
	});

	after(function () {
		console.info(`After: ${this.test?.parent?.title}`);
		clearDisk();
	});

	function errorValidator(error: unknown): error is PQErrorKind {
		return error === "InsightError" || error === "ResultTooLargeError";
	}

	// Assert value equals expected
	function assertResult(actual: unknown, expected: Output): void {
		expect(actual).to.have.deep.members(expected).and.have.lengthOf(expected.length);
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
			errorValidator,
			assertOnResult: assertResult,
			assertOnError: assertError, // options
		}
	);
});

describe("Dynamic folder test for ordered queries", function () {
	type Output = InsightResult[];
	type PQErrorKind = "InsightError" | "ResultTooLargeError";
	let sections: string;
	let facade: InsightFacade;

	before(async function () {
		clearDisk();
		sections = getContentFromArchives("pair.zip");
		facade = new InsightFacade();
		await facade.addDataset("sections", sections, InsightDatasetKind.Sections);
	});

	after(function () {
		console.info(`After: ${this.test?.parent?.title}`);
		clearDisk();
	});

	function errorValidator(error: unknown): error is PQErrorKind {
		return error === "InsightError" || error === "ResultTooLargeError";
	}

	// Assert value equals expected
	function assertResult(actual: unknown, expected: Output): void {
		expect(actual).to.deep.equal(expected);
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
		"./test/resources/orderedQueries", // path
		{
			errorValidator,
			assertOnResult: assertResult,
			assertOnError: assertError, // options
		}
	);
});


describe("Dynamic folder test for transformation queries", function () {
	type Output = InsightResult[];
	type PQErrorKind = "InsightError" | "ResultTooLargeError";
	let sections: string;
	let facade: InsightFacade;

	before(async function () {
		clearDisk();
		sections = getContentFromArchives("pair.zip");
		facade = new InsightFacade();
		await facade.addDataset("sections", sections, InsightDatasetKind.Sections);
	});

	after(function () {
		console.info(`After: ${this.test?.parent?.title}`);
		clearDisk();
	});

	function errorValidator(error: unknown): error is PQErrorKind {
		return error === "InsightError" || error === "ResultTooLargeError";
	}

	// Assert value equals expected
	function assertResult(actual: unknown, expected: Output): void {
		expect(actual).to.deep.equal(expected);
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
		"./test/resources/transformations", // path
		{
			errorValidator,
			assertOnResult: assertResult,
			assertOnError: assertError, // options
		}
	);
});

describe("Dynamic folder test for unordered rooms queries", function () {
	type Output = InsightResult[];
	type PQErrorKind = "InsightError" | "ResultTooLargeError";
	let rooms: string;
	let facade: InsightFacade;

	before(async function () {
		clearDisk();
		rooms = getContentFromArchives("campus.zip");
		facade = new InsightFacade();
		await facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
	});

	after(function () {
		clearDisk();
	});

	function errorValidator(error: unknown): error is PQErrorKind {
		return error === "InsightError" || error === "ResultTooLargeError";
	}

	// Assert value equals expected
	function assertResult(actual: unknown, expected: Output): void {
		expect(actual).to.have.deep.members(expected).and.have.lengthOf(expected.length);
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
		"./test/resources/roomsQueries", // path
		{
			errorValidator,
			assertOnResult: assertResult,
			assertOnError: assertError, // options
		}
	);
});
