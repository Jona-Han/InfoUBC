import {InsightError, InsightResult} from "../controller/IInsightFacade";
import {Filter, IQuery, JSONQuery, Options} from "./IQuery";
import * as fs from "fs-extra";
import QueryValidator from "../utils/QueryValidator";
import Dataset from "./Dataset";

export class Query implements IQuery {
	public WHERE: Filter;
	public OPTIONS: Options;
	public datasetName: string;

    private directory = "./data";

	constructor(queryJSON: JSONQuery) {
		let QV: QueryValidator = new QueryValidator();
		this.datasetName = QV.validateQuery(queryJSON);
		this.WHERE = queryJSON.WHERE;
		this.OPTIONS = queryJSON.OPTIONS;
	}

	public execute(): InsightResult[] {
        console.log(`The dataset name is ${this.datasetName}`);
        if (!fs.pathExistsSync(this.directory + "/" + this.datasetName + ".json")) {
            throw new InsightError(`Cannot query from ${this.datasetName} due to not being added yet.`)
        }
        // this.loadData();
		return [{test: 39}];
	}

    private loadData() {
        const object = fs.readJSONSync(this.directory + "/" + this.datasetName + ".json");
        const dataset: Dataset = new Dataset(this.datasetName);
        console.log(object);
        dataset.addSections(object.sections);
        return dataset;
    }
}
