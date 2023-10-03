import {InsightError, InsightResult} from "../controller/IInsightFacade";
import {Filter, IQuery, JSONQuery, Options} from "./IQuery";

import QueryValidator from "../utils/QueryValidator";

export class Query implements IQuery {
	public WHERE: Filter;
	public OPTIONS: Options;
	public datasetName: string;

	constructor(queryJSON: JSONQuery) {
		let QV: QueryValidator = new QueryValidator();
		this.datasetName = QV.validateQuery(queryJSON);
		this.WHERE = queryJSON.WHERE;
		this.OPTIONS = queryJSON.OPTIONS;
	}

	public execute(): InsightResult[] {
		return [{test: 39}];
	}
}
