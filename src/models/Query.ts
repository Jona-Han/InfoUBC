import {InsightError} from "../controller/IInsightFacade";
import {Filter, IQuery, JSONQuery, Options} from "./IQuery";

import {validateWhere, validateLogicComparison, validateOptions} from "../utils/QueryValidator";

export class Query implements IQuery {
	public WHERE: Filter;
	public OPTIONS: Options;
	public datasetName: string;

	constructor(queryJSON: JSONQuery) {
		this.validateQuery(queryJSON);
		this.WHERE = queryJSON.WHERE;
		this.OPTIONS = queryJSON.OPTIONS;
		this.datasetName = "";
		this.setDatasetName();
	}

	private validateQuery(query: JSONQuery): void {
		validateWhere(query.WHERE);
		validateOptions(query.OPTIONS);
	}

	private setDatasetName(): void {
		if (this.OPTIONS.COLUMNS && this.OPTIONS.COLUMNS.length > 0) {
			this.datasetName = this.OPTIONS.COLUMNS[0].split("_")[0];
		} else {
			throw new InsightError("No dataset name found in query");
		}
	}
}
