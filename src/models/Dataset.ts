import {InsightDatasetKind, InsightError} from "../controller/IInsightFacade";

export interface Section {
	uuid: string;
	id: string;
	title: string;
	instructor: string;
	dept: string;
	year: number;
	avg: number;
	pass: number;
	fail: number;
	audit: number;
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
			uuid: this.keyToString(section, "id"),
			id: this.keyToString(section, "Course"),
			title: this.keyToString(section, "Title"),
			instructor: this.keyToString(section, "Professor"),
			dept: this.keyToString(section, "Subject"),
			year: this.keyToNumber(section, "Year"),
			avg: this.keyToNumber(section, "Avg"),
			pass: this.keyToNumber(section, "Pass"),
			fail: this.keyToNumber(section, "Fail"),
			audit: this.keyToNumber(section, "Audit"),
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
