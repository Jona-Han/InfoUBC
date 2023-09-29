import {InsightError} from "../controller/IInsightFacade";
import {Filter, IQuery, JSONQuery, Options} from "./IQuery";

import {validateWhere, validateLogicComparison, validateOptions} from "./QueryValidator";

export class Query implements IQuery {
	private WHERE: Filter;
	private OPTIONS: Options;
	private datasetName: string;

	constructor(queryJSON: JSONQuery) {
		this.validateQuery(queryJSON);
		this.WHERE = queryJSON.WHERE;
		this.OPTIONS = queryJSON.OPTIONS;
		this.datasetName = "";
		this.setDatasetName();
	}

	private validateQuery(query: IQuery): void {
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
