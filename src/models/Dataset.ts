import {InsightDatasetKind, InsightError} from "../controller/IInsightFacade";

export interface Section {
	id: string;
	Course: string;
	Title: string;
	Professor: string;
	Subject: string;
	Year: number;
	Avg: number;
	Pass: number;
	Fail: number;
	Audit: number;
}

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

	public getSize(): number {
		return this.size;
	}

	public getSections(): Section[] {
		return this.sections;
	}

	// Increases size by 1
	public addSection(section: any): void {
		const formattedSection: Section = this.newSection(section);
		this.sections.push(formattedSection);
		this.size++;
	}

	// Adds sections to a dataset
	public addSections(sections: any[]): void {
		// console.log("adding sections")
		for (let section of sections) {
			this.addSection(section);
		}
	}

	private newSection(section: any): Section {
		let newSection: Section = {
			id: this.keyToString(section, "id"),
			Course: this.keyToString(section, "Course"),
			Title: this.keyToString(section, "Title"),
			Professor: this.keyToString(section, "Professor"),
			Subject: this.keyToString(section, "Subject"),
			Year: this.keyToNumber(section, "Year"),
			Avg: this.keyToNumber(section, "Avg"),
			Pass: this.keyToNumber(section, "Pass"),
			Fail: this.keyToNumber(section, "Fail"),
			Audit: this.keyToNumber(section, "Audit"),
		};
		return newSection;
	}

	private keyToType(section: any, key: string, type: "string" | "number"): string | number {
		const object = section[key];
		if (object === undefined) {
			throw new InsightError(key + " is undefined");
		}
		if (typeof object === type) {
			return object;
		}

		try {
			if (type === "string") {
				return object.toString();
			} else {
				let result = parseInt(object, 10);
				if (!result && result !== 0) {
					throw new InsightError();
				}
				return result;
			}
		} catch {
			throw new InsightError(key + " cannot be converted to " + type);
		}
	}

	private keyToString(section: any, key: string): string {
		return this.keyToType(section, key, "string") as string;
	}

	private keyToNumber(section: any, key: string): number {
		return this.keyToType(section, key, "number") as number;
	}
}
