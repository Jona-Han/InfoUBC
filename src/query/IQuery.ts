import {InsightResult} from "../controller/IInsightFacade";

export type Logic = "AND" | "OR";
export type MComparator = "LT" | "GT" | "EQ";
export type SComparator = "IS";

export type MField = "avg" | "pass" | "fail" | "audit" | "year";
export type RoomMField = "lat" | "lon" | "seats";
export type SField = "dept" | "id" | "instructor" | "title" | "uuid";
export type RoomSField = "fullname" | "shortname" | "number" | "name" | "address" | "type" | "furniture" | "href";
export type ApplyToken = "MAX" | "MIN" | "AVG" | "COUNT" | "SUM";
export type Direction = "UP" | "DOWN";
export type AnyKey = Key | ApplyKey;
export type ApplyKey = string; // One or more of any character, except underscore.
export type Key = string; // mkey or skey

export type Filter = LogicComparison | MComparison | SComparison | Negation;

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

export type Columns = AnyKey[];

export interface Sort {
	dir: Direction,
    keys: AnyKey[];
}

export interface Options {
	COLUMNS: Columns;
	ORDER?: Sort | AnyKey;
}

export interface Transformations {
	GROUP: Key[];
	APPLY: ApplyRule[];
}

export interface ApplyRule {
	[key: string]: {
		[key in ApplyToken]?: Key;
	};
}

export interface JSONQuery {
	WHERE: Filter;
	OPTIONS: Options;
	TRANSFORMATIONS?: Transformations;
}

export interface IQuery extends JSONQuery {
	datasetName: string;

    execute(): InsightResult[];
}
