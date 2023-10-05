import {expect} from "chai";
import { Query } from "../../src/models/Query";
import { InsightError } from "../../src/controller/IInsightFacade";

describe('loadDataset', () => {
    it('should just print out an object', () => {
        try {
            const query = new Query({
                "WHERE": {
                    "GT": {
                        "ubc_avg": 85
                    }
                },
                "OPTIONS": {
                    "COLUMNS": [
                        "ubc_dept",
                        "ubc_id",
                        "ubc_avg"
                    ]
                }
            })
            query.execute();
        } catch (error: any) {
            expect.fail(error.message);
        }
    })
})