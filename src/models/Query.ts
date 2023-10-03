import {InsightError} from "../controller/IInsightFacade";
import {Filter, IQuery, JSONQuery, Options} from "./IQuery";

import {validateQuery} from "../utils/QueryValidator";

export class Query implements IQuery {
	public WHERE: Filter;
	public OPTIONS: Options;
	public datasetName: string;

	constructor(queryJSON: JSONQuery) {
		this.validate(queryJSON);
		this.WHERE = queryJSON.WHERE;
		this.OPTIONS = queryJSON.OPTIONS;
		this.datasetName = "";
		this.setDatasetName();
	}

	private validate(query: object): void {
		validateQuery(query as object);
	}

	private setDatasetName(): void {
		if (this.OPTIONS.COLUMNS && this.OPTIONS.COLUMNS.length > 0) {
			this.datasetName = this.OPTIONS.COLUMNS[0].split("_")[0];
		} else {
			throw new InsightError("No dataset name found in query");
		}
	}
}
