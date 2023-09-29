export type Logic = "AND" | "OR";
export type MComparator = "LT" | "GT" | "EQ";
export type MField = "avg" | "pass" | "fail" | "audit" | "year";
export type SField = "dept" | "id" | "instructor" | "title" | "uuid";
export type Key = string;

export type Filter = LogicComparison | MComparison | SComparison | Negation | null;

export type LogicComparison = {
	[Key in Logic]?: Filter[];
};

export type MComparison = {
	[Key in MComparator]?: {[key: string]: number};
};

export type SComparison = {
	IS?: {[key: string]: string};
};

export type Negation = {
	filter: Filter;
};

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

	validateQuery(query: IQuery): void;
	setDatasetName(): void;
}
