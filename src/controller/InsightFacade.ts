import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError, InsightResult} from "./IInsightFacade";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	private datasets: string[];

	constructor() {
		this.datasets = [];
		console.log("InsightFacadeImpl::init()");
	}

	// 1. Check valid InsightDatasetKind
	// 2. Check valid id
	// 3. Check Valid content
	// 4. Add dataset
	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		return Promise.reject(new InsightError());
	}
	// 1. Check valid id
	// 2. Check id is in dataset
	// 3. Remove dataset
	public removeDataset(id: string): Promise<string> {
		return Promise.reject(new InsightError());
	}

	// 1. Check dataset is present
	// 2. Check Query is valid
	// 3. Check id is a query that was added
	// 4. Check that output is not too large
	// 5. return output
	public performQuery(query: unknown): Promise<InsightResult[]> {
		return Promise.reject(new InsightError());
	}

	public listDatasets(): Promise<InsightDataset[]> {
		return Promise.reject(new InsightError());
	}

	// Returns true if id is an empty string, contains only white space or contains an undersore
	private isNotValidID(id: string): boolean {
		let isNotValid: boolean = true;
		for (let letter of id) {
			if (letter === "_") {
				return true;
			} else if (letter !== " ") {
				isNotValid = false;
			}
		}
		return isNotValid;
	}

	// Returns true if content is a valid data set
	private isValidDataset(content: string): boolean {
		return false; // stub
	}

	// Returns true if query is not a valid query
	private isNotValidQuery(query: unknown): boolean {
		return true; // stub
	}
}
