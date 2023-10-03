import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
} from "./IInsightFacade";
import Dataset from "./Dataset";
import QueryValidator from "../utils/QueryValidator";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	private datasets: {[key: string]: Dataset};

	constructor() {
		this.datasets = {};
		console.log("InsightFacadeImpl::init()");
	}

	// 1. Check valid InsightDatasetKind
	// 2. Check valid id
	// 3. Check Valid content
	// 4. Add dataset
	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		return new Promise((resolve, reject) => {
			if (kind === InsightDatasetKind.Rooms) {
				reject(new InsightError("kind must be InsightDatasetKind.Sections"));
			}
			if (this.isNotValidID(id)) {
				reject(new InsightError("Invalid id"));
			}
			if (this.isValidDataset(content)) {
				reject("Missing remaining implementation");
			}
			reject(new InsightError("Invalid dataset"));
		});
	}
	// 1. Check valid id
	// 2. Check id is in dataset
	// 3. Remove dataset
	public removeDataset(id: string): Promise<string> {
		return new Promise((resolve, reject) => {
			if (this.isNotValidID(id)) {
				reject(new InsightError("Invalid id"));
				// } if (this.datasets.contains(id)) {
				// 	reject(new NotFoundError("ID not present in dataset"))
			}
			reject("Not implemented");
		});
	}

	// 1. Check dataset is present
	// 2. Check Query is valid
	// 3. Check id is a query that was added
	// 4. Check that output is not too large
	// 5. return output
	public performQuery(query: unknown): Promise<InsightResult[]> {
		return new Promise((resolve, reject) => {
			let results: InsightResult[] = [];
			let QV: QueryValidator = new QueryValidator();

			try {
                // May need to check if query is actually a json object
				QV.validateQuery(query as object);
				resolve(results);
			} catch (error) {
				reject(new InsightError());
			}
		});
	}

	public listDatasets(): Promise<InsightDataset[]> {
		return new Promise((resolve, reject) => {
			resolve([]); // stub
		});
	}

	// Returns true if id is an empty string, contains only white space or contains an undersore
	public isNotValidID(id: string): boolean {
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
	public isValidDataset(content: string): boolean {
		return false; // stub
	}

	// Returns true if query is not a valid query
	public isNotValidQuery(query: unknown): boolean {
		return true; // stub
	}
}
