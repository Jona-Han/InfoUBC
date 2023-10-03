import {InsightDatasetKind} from "./IInsightFacade";
import Section from "./Section";

export default class Dataset {
	private id: string;
	private size: number;
	private sections: Section[];
	private kind: InsightDatasetKind;

	constructor(id: string) {
		this.id = id;
		this.size = 0;
		this.sections = [];
		this.kind = InsightDatasetKind.Sections;
	}

	// Getters
	public getId(): string {
		return this.id;
	}

	// Increases size by 1
	public addSection(section: any): void {
		const formattedSection = new Section(section);
		this.sections.push(formattedSection);
		this.size++;
	}

	public addSections(sections: any[]): void {
		// console.log("adding sections")
		for (let section of sections) {
			this.addSection(section);
		}
	}
}
