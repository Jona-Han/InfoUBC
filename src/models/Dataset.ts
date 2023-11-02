import { InsightDatasetKind, InsightError } from "../controller/IInsightFacade";

/**
 * Abstract class representing a generic dataset.
 */
export abstract class Dataset {
	private id: string;
	protected size: number;
	private kind: InsightDatasetKind;
	protected data: any[];

	/**
	 * Constructs a Dataset instance.
	 * @param {string} id - Unique identifier for the dataset.
	 * @param {InsightDatasetKind} kind - The type/kind of dataset (e.g., Sections, Rooms).
	 */
	constructor(id: string, kind: InsightDatasetKind) {
		this.size = 0;
		this.id = id;
		this.kind = kind;
		this.data = [];
	}

	/**
	 * Gets the dataset's unique identifier.
	 * @returns {string} The dataset's ID.
	 */
	public getId(): string {
		return this.id;
	}

	/**
	 * Gets the size of the dataset.
	 * @returns {number} The dataset's size.
	 */
	public getSize(): number {
		return this.size;
	}

	/**
	 * Gets the kind of the dataset.
	 * @returns {InsightDatasetKind} The dataset's kind.
	 */
	public getKind(): InsightDatasetKind {
		return this.kind;
	}

	/**
	 * Gets the dataset's data.
	 * @returns {any[]} An array containing the dataset's entries.
	 */
	public getData(): any[] {
		return this.data;
	}

	/**
	 * Converts the dataset's data into a map.
	 * @returns {Map<string, any>} A map where keys are either UUIDs (for Sections) or HREFs (for Rooms),
	 * and values are the dataset entries.
	 */
	public getDataAsMap(): Map<string, any> {
		const map = new Map<string, any>();
		this.data.forEach((entry) => {
			map.set(this.kind === InsightDatasetKind.Sections ? entry.uuid : entry.href, entry);
		});
		return map;
	}

	/**
	 * Adds data to the dataset from a JSON object.
	 * @param {any[]} fileData - The data entries to be added.
	 */
	public addDataFromJSON(fileData: any[]): void {
		if (!fileData || !Array.isArray(fileData)) {
			throw new InsightError(`No valid ${this.kind}`);
		}
		for (let entry of fileData) {
			this.addAlreadyValidEntry(entry);
		}
	}

	/**
	 * Private method to add a validated data entry to the dataset.
	 * @param {any} entry - The entry to be added.
	 */
	private addAlreadyValidEntry(entry: any) {
		if (entry !== undefined) {
			this.data.push(entry);
			this.size++;
		}
	}
}
