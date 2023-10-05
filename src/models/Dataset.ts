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

	// Adds section to this.section and increases size by 1
	public addSection(section: {[key: string]: string | number}): void {
		if (section === undefined) {
			throw new InsightError("Invalid section");
		}
		const formattedSection: Section = this.newSection(section);
		this.sections.push(formattedSection);
		// console.log(this.sections)
		this.size++;
	}

	// Adds sections to a dataset
	// Throws InsightError if input list is empty
	public addSections(sections: any[]): void {
		// console.log(this.getSize())
		if (sections === undefined || sections.length === 0) {
			throw new InsightError("No valid sections");
		}
		for (let section of sections) {
			this.addSection(section);
		}
		// console.log(this.getSize())
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

	// Checks the type of the key and tries to conver to type, otherwise throws InsightError
	private keyToType(section: any, key: string, type: "string" | "number"): string | number {
		const obj = section[key];
		if (obj === undefined) {
			throw new InsightError(key + " is undefined");
		}
		if (typeof obj === type) {
			return obj;
		}

		try {
			if (type === "string") {
				// console.log("returning: " + key)
				return obj.toString();
			} else {
				let result = parseInt(obj, 10);
				if (!result && result !== 0) {
					throw new InsightError();
				}
				// console.log("returning: " + key);
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
