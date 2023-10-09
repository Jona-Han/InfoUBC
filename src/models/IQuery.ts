export type Logic = "AND" | "OR";
export type MComparator = "LT" | "GT" | "EQ";
export type SComparator = "IS";
export type MField = "avg" | "pass" | "fail" | "audit" | "year";
export type SField = "dept" | "id" | "instructor" | "title" | "uuid";
export type Key = string;

export type Filter = LogicComparison | MComparison | SComparison | Negation | null;

export type LogicComparison = {
	[key in Logic]?: Filter[];
};

export type MComparison = {
	[key in MComparator]?: {[key: string]: number};
};

export interface SComparison {
	IS: {[key: string]: string};
}

export interface Negation {
	NOT: Filter;
}

export interface Options {
	COLUMNS: Key[];
	ORDER?: Key;
}

export interface JSONQuery {
	WHERE: Filter;
	OPTIONS: Options;
}

export interface IQuery {
	WHERE: Filter;
	OPTIONS: Options;
	datasetName: string;
}

export class QueryError extends Error {
	constructor(message?: string) {
		super(message);
		Error.captureStackTrace(this, QueryError);
	}
}
