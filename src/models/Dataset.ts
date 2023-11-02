import {InsightDatasetKind, InsightError} from "../controller/IInsightFacade";

export abstract class Dataset {
	private id: string;
	protected size: number;
	private kind: InsightDatasetKind;
	protected data: any[];

	constructor(id: string, kind: InsightDatasetKind) {
		this.size = 0;
		this.id = id;
		this.kind = kind;
		this.data = [];
	}

	public getId(): string {
		return this.id;
	}

	public getSize(): number {
		return this.size;
	}

	public getKind(): InsightDatasetKind {
		return this.kind;
	}

	public getData(): any[] {
		return this.data;
	}

	public getDataAsMap(): Map<string, any> {
		const map = new Map<string, any>();
		this.data.forEach((entry) => {
			map.set(this.kind === InsightDatasetKind.Sections ? entry.uuid : entry.href, entry);
		});
		return map;
	}

	public addDataFromJSON(fileData: any[]): void {
		if (!fileData || !Array.isArray(fileData)) {
			throw new InsightError(`No valid ${this.kind}`);
		}
		for (let entry of fileData) {
			this.addAlreadyValidEntry(entry);
		}
	}

	private addAlreadyValidEntry(entry: any) {
		if (entry !== undefined) {
			this.data.push(entry);
			this.size++;
		}
	}
}
