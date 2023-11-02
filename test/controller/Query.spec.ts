import { expect } from "chai";
import { InsightDatasetKind, InsightError } from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";
import { clearDisk, getContentFromArchives } from "../TestUtil";

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
    
    context("a string is passed in", function () {
        it("should fail with insightError with a string with performQuery", async function () {
            try {
                await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
                await facade.performQuery({WHERE:null, OPTIONS: null});
                expect.fail("Error should have been thrown");
            } catch (error) {
                console.log(error)
                expect(error).to.be.an.instanceOf(InsightError);
            }
        });
    });
})