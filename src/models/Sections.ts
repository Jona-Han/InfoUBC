import {InsightDatasetKind, InsightError} from "../controller/IInsightFacade";
import { Dataset } from "./Dataset";

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

export default class Sections extends Dataset {
	private sections: Section[];

	constructor(id: string) {
        super(id, InsightDatasetKind.Sections);
		this.sections = [];
	}

    public getData(): Section[] {
		return this.sections;
	}

    public addDataFromJSON(fileData: any[]): void {
        if (fileData === undefined) {
			throw new InsightError("No valid sections");
		}
		for (let section of fileData) {
            this.addAlreadyValidSection(section);
		} 
    }

	public getDataAsMap(): Map<string, any> {
		const map = new Map<string, Section>();
		this.sections.forEach((section) => {
			map.set(section.uuid, section);
		});
		return map;
	}

    private addAlreadyValidSection(section: any): void {
		if (section !== undefined) {
            this.sections.push(section as Section);
            this.size++;
		}
	}

	// Adds section to this.section and increases size by 1
	// If section is missing required keys then it does not add
	public addSection(section: any): void {
		if (section !== undefined) {
			try {
				const formattedSection: Section = this.newSection(section);
				this.sections.push(formattedSection);
				// console.log(this.sections)
				this.size++;
			} catch {
				// do nothing
			}
		}
	}

	// Adds sections to a dataset
	// Throws InsightError if input list is empty
	public addSections(sections: any[]): void {
		// console.log(this.getSize())
		if (sections === undefined) {
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
			year: this.getYear(section),
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

	private getYear(section: any): number {
		if (section["Section"] === "overall") {
			return 1900;
		} else {
			return this.keyToNumber(section, "Year");
		}
	}
}
