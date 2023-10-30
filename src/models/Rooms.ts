import {InsightDatasetKind, InsightError} from "../controller/IInsightFacade";

export interface Room {
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

export default class Rooms {
	private id: string;

	constructor(id: string) {
		this.id = id;
	}

	// Searches nodes for links to building files
	public addBuildings(node: any): Map<string, boolean> {
		let result: Map<string, boolean> = new Map();
		let todo = [node];
		while (todo.length > 0) {
			let curr = todo.pop();
			if (curr.childNodes) {
				for (let child of curr.childNodes) {
					todo.push(child);
				}
			}
			if (curr.nodeName === "tbody") {
				this.getLinksFromTable(curr, result);
			}
		}
		return result;
	}

	private getLinksFromTable(curr: any, result: Map<string, boolean>) {
		if (curr.nodeName === "a" && curr.attrs) {
			for (const attr of curr.attrs) {
				let link = attr.value;
				if (attr.name === "href" && link) {
					if (link.substring(0, 2) === "./") {
						link = link.substring(2, link.length);
					}
					result.set(link, true);
				}
			}
		}
	}
}
