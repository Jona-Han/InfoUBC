import { InsightDatasetKind } from "../controller/IInsightFacade";

export abstract class Dataset {
    private id: string;
	protected size: number;
    private kind: InsightDatasetKind;
    
    constructor(id: string, kind: InsightDatasetKind) {
		this.size = 0;
        this.id = id;
        this.kind = kind;
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

    abstract getData(): any[];

    abstract getDataAsMap(): Map<string, any>;

    abstract addDataFromJSON(fileData: any[]): void;
}