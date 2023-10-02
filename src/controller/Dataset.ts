import {InsightDatasetKind} from "./IInsightFacade";
import Section from "./Section";

export default class Dataset {
	private id: string;
	private size: number;
	private sections: Section[];
	private kind: InsightDatasetKind;

	constructor() {
		this.id = "";
		this.size = 0;
		this.sections = [];
		this.kind = InsightDatasetKind.Sections;
	}
}
