import {
	IInsightFacade,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	ResultTooLargeError,
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";

import {folderTest} from "@ubccpsc310/folder-test";
import {expect, use} from "chai";
import chaiAsPromised from "chai-as-promised";
import {clearDisk, getContentFromArchives} from "../TestUtil";

use(chaiAsPromised);

describe("Insight Facade Helper Function Tests", function () {
	let facade: InsightFacade;

	describe("IsNotValidID", function () {
		// before(function() {

		// })

		beforeEach(function () {
			facade = new InsightFacade();
		});

		it("Empty string id should return true", function () {
			let result = facade.isNotValidID("");
			expect(result).to.be.true;
		});

		it("String id with underscores should return true", function () {
			let results: boolean[] = [
				facade.isNotValidID("_"),
				facade.isNotValidID("_ID"),
				facade.isNotValidID("I_D"),
				facade.isNotValidID("ID_"),
			];
			for (let result of results) {
				expect(result).to.be.true;
			}
		});

		it("String id with just empty space should return true", function () {
			let results: boolean[] = [
				facade.isNotValidID(" "),
				facade.isNotValidID("   "),
				facade.isNotValidID("         "),
			];
			for (let result of results) {
				expect(result).to.be.true;
			}
		});

		it("String id is valid should return false", function () {
			let results: boolean[] = [
				facade.isNotValidID("Yes"),
				facade.isNotValidID("Also yes"),
				facade.isNotValidID("This.is.valid"),
			];
			for (let result of results) {
				expect(result).to.be.false;
			}
		});
	});
});
