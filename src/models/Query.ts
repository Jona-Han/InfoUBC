import { InsightError } from "../controller/IInsightFacade";

type Logic = "AND" | "OR";
type MComparator = "LT" | "GT" | "EQ";
type MField = "avg" | "pass" | "fail" | "audit" | "year";
type SField = "dept" | "id" | "instructor" | "title" | "uuid";
type Key = string;

type Filter = LogicComparison | MComparison | SComparison | Negation | null;

type LogicComparison = {
    [Key in Logic]?: Filter[];
}

type MComparison = {
    [Key in MComparator]?: { [key: string]: number };
}

type SComparison = {
    IS?: { [key: string]: string };
}

type Negation = {
	filter: Filter;
}

interface Options {
	COLUMNS: Key[];
	ORDER?: Key;
}

interface Query {
	WHERE: Filter;
	OPTIONS: Options;
}

class QueryClass {
    private where: Filter;
    private options: Options;
    private datasetName: string;

    constructor(queryJSON: Query) {
        this.validateQuery(queryJSON);
        this.where = queryJSON.WHERE;
        this.options = queryJSON.OPTIONS;
        this.datasetName = "";
        this.setDatasetName();
    }

    private validateQuery(query: Query): void {
        this.validateWhere(query.WHERE);
        this.validateOptions(query.OPTIONS);
    }

    private setDatasetName(): void {
        if (this.options.COLUMNS && this.options.COLUMNS.length > 0) {
            this.datasetName = this.options.COLUMNS[0].split('_')[0];
        } else {
            throw new InsightError("No dataset name found in query");
        }
    }
}
