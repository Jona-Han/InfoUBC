import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
} from "./IInsightFacade";
import Dataset from "../models/Dataset";

import fs from "fs-extra";
import JSZip from "jszip";
import QueryValidator from "../utils/QueryValidator";
import {Query} from "../models/Query";
import {JSONQuery} from "../models/IQuery";

const persistDir = "./data";
// const tempDir = "./temp";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	// Datasets is a map of dataset ids to if they are used or not.
	// Will return undefined if id was never used or false if it was removed already.
	private static datasets: Map<string, InsightDataset | false>;

	constructor() {
		InsightFacade.datasets = new Map();
		this.initialize();
		console.log("InsightFacadeImpl::init()");
	}

	// 1. Check valid InsightDatasetKind
	// 2. Check valid id
	// 3. Check Valid content
	// 4. Add dataset
	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		if (kind !== InsightDatasetKind.Sections) {
			return Promise.reject(new InsightError("kind must be InsightDatasetKind.Sections"));
		} else if (this.isNotValidID(id)) {
			// Reject if id is not valid
			return Promise.reject(new InsightError("Invalid id"));
		}
		// Reject if a dataset with the same id is already present
		if (InsightFacade.datasets.get(id)) {
			return Promise.reject(new InsightError("id already present in dataset"));
		}

		return this.addContent(id, content);
		// Try to extract content and put in ./temp/id
		// let dataset = new Dataset(id);

		// // console.log("1. before ensure tempDir")
		// return fs.ensureDir(tempDir)
		// 		// console.log("2. before extractContent")
		// 		.then(() => {
		// 			return this.extractContent(id, content);
		// 		})
		// 		// console.log("3. before readFilesToDataset")
		// 		.then(() => {

		// 			return this.readFilesToDataset(dataset);
		// 		})
		// 		// console.log("4. after readFilesToDataset")
		// 		// console.log(dataset.getSize());
		// 		.then(() => {

		// 			if (dataset.getSize() < 1) {
		// 				// console.log("We here")
		// 				throw new InsightError("No valid sections");
		// 			}
		// 			return fs.ensureDir(persistDir);
		// 		})
		// 		.then(() => {
		// 			const data = {
		// 				id: dataset.getId(),
		// 				kind: InsightDatasetKind.Sections,
		// 				numRows: dataset.getSize(),
		// 				sections: dataset.getSections(),
		// 			};
		// 			return fs.writeJSON(persistDir + "/" + id + ".json", data);
		// 		})
		// 		.then(() => {
		// 			const data2: InsightDataset = {
		// 				id: dataset.getId(),
		// 				kind: InsightDatasetKind.Sections,
		// 				numRows: dataset.getSize(),
		// 			};
		// 			InsightFacade.datasets.set(id, data2);
		// 			fs.ensureDirSync(tempDir)
		// 			fs.removeSync(tempDir);
		// 			let result: string[] = [];
		// 			for (let k of InsightFacade.datasets.keys()) {
		// 				if (InsightFacade.datasets.get(k)) {
		// 					result.push(k);
		// 				}
		// 			}
		// 			return Promise.resolve(result);
		// 		})
		// 		.catch((e) => {
		// 			// console.log("3")
		// 			fs.ensureDirSync(tempDir)
		// 			fs.removeSync(tempDir);
		// 			throw new InsightError("" + e);
		// 		})
		// console.log("before ensureDir(persistDir)")

		// console.log("before writing to file")
	}

	// 1. Check valid id
	// 2. Check id is in dataset
	// 3. Remove dataset
	public async removeDataset(id: string): Promise<string> {
		if (this.isNotValidID(id)) {
			return Promise.reject(new InsightError("Invalid id"));
			// } if (InsightFacade.datasets.contains(id)) {
			// 	reject(new NotFoundError("ID not present in dataset"))
		}
		if (!InsightFacade.datasets.get(id)) {
			return Promise.reject(new NotFoundError("ID not present in dataset"));
		}

		try {
			await fs.remove(persistDir + "/" + id + ".json");
			InsightFacade.datasets.set(id, false);
			return Promise.resolve(id);
		} catch {
			return Promise.reject(new InsightError("Error removing dataset"));
		}
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
				if (!fs.pathExistsSync(persistDir)) {
					throw new InsightError("No datasets added");
				}

				if (typeof query !== "object") {
					throw new InsightError("Query must be an object");
				}
				QV.validateQuery(query as object);
				let parsedQuery = new Query(query as JSONQuery);
				results = parsedQuery.execute();
				resolve(results);
			} catch (error) {
				reject(error);
			}
		});
	}

	public listDatasets(): Promise<InsightDataset[]> {
		return new Promise((resolve, reject) => {
			let result: InsightDataset[] = [];
			for (let dataset of InsightFacade.datasets.values()) {
				if (dataset) {
					result.push(dataset);
				}
			}
			resolve(result);
		});
	}

	private initialize(): void {
		try {
			fs.ensureDirSync(persistDir);
			let files = fs.readdirSync(persistDir);
			for (let file of files) {
				let object = fs.readJSONSync(persistDir + "/" + file);
				let data: InsightDataset = {
					id: object.id,
					kind: object.kind,
					numRows: object.numRows,
				};
				InsightFacade.datasets.set(object.id, data);
			}
		} catch {
			console.error("Unable to initialize directory");
		}
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

	// Returns true if query is not a valid query
	public isNotValidQuery(query: unknown): boolean {
		return true; // stub
	}

	private async addContent(id: string, content: string): Promise<string[]> {
		// console.log("Trying to add dataset to data");
		try {
			let dataset = new Dataset(id);
			const stringBuffer = Buffer.from(content, "base64");
			const zip = new JSZip();
			// console.log("2.2: before AsyncLoad")
			await zip.loadAsync(stringBuffer);
			const files = zip.files;

			const promises = [];

			for (let fileName of Object.keys(files)) {
				try {
					let newPromise;
					if (fileName.length > 8 && fileName.substring(0, 8) === "courses/") {
						let file = zip.files[fileName];
						if (!file.dir) {
							newPromise = file.async("text").then((fileContent) => {
								let object = JSON.parse(fileContent);
								let result = object["result"];
								dataset.addSections(result);
								// console.log(dataset.getSize())
							});
						}
					}
					promises.push(newPromise);
				} catch {
					// It's ok to catch a single itteration
				}
			}

			await Promise.all(promises);
			if (dataset.getSize() < 1) {
				throw new InsightError("No valid sections");
			}
			await this.writeDatasetToFile(dataset);
			return this.updateDatasets(dataset);
		} catch (e) {
			throw new InsightError("Error extracting data: " + e);
		}
	}

	private writeDatasetToFile(dataset: Dataset): Promise<void> {
		let data = {
			id: dataset.getId(),
			kind: InsightDatasetKind.Sections,
			numRows: dataset.getSize(),
			sections: dataset.getSections(),
		};
		return fs.writeFile(persistDir + "/" + dataset.getId() + ".json", JSON.stringify(data));
	}

	private updateDatasets(dataset: Dataset): Promise<string[]> {
		let results: string[] = [];
		let data: InsightDataset = {
			id: dataset.getId(),
			kind: InsightDatasetKind.Sections,
			numRows: dataset.getSize(),
		};
		InsightFacade.datasets.set(dataset.getId(), data);
		for (let potentialDataset of InsightFacade.datasets.keys()) {
			if (InsightFacade.datasets.get(potentialDataset)) {
				results.push(potentialDataset);
			}
		}

		return Promise.resolve(results);
	}
	// addDataset helper function
}
