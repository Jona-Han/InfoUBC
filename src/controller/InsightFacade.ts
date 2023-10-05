import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
} from "./IInsightFacade";
import Dataset from "../models/Dataset";

import * as fs from "fs-extra";
import {writeFileSync} from "fs";
import JSZip from "jszip";
import QueryValidator from "../utils/QueryValidator";
import {Query} from "../models/Query";
import {JSONQuery} from "../models/IQuery";

const persistDir = "./data";
const tempDir = "./temp";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	// Datasets is a map of dataset ids to if they are used or not.
	// Will return undefined if id was never used or false if it was removed already.
	private datasets: Map<string, boolean>;

	constructor() {
		this.datasets = new Map();
		console.log("InsightFacadeImpl::init()");
	}

	// 1. Check valid InsightDatasetKind
	// 2. Check valid id
	// 3. Check Valid content
	// 4. Add dataset
	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		if (kind !== InsightDatasetKind.Sections) {
			return Promise.reject(new InsightError("kind must be InsightDatasetKind.Sections"));
		}

		// Reject if ID is not valid
		if (this.isNotValidID(id)) {
			return Promise.reject(new InsightError("Invalid id"));
		}
		// Reject if a dataset with the same id is already present
		if (this.datasets.get(id) !== undefined && this.datasets.get(id)) {
			return Promise.reject(new InsightError("Key already present in dataset"));
		}
		// Try to extract content and put in ./temp/id
		let dataset = new Dataset(id);
		try {
			await this.extractContent(id, content);
		} catch {
			fs.removeSync(tempDir);
			return Promise.reject(new InsightError("Unable to extract data from content"));
		}
		try {
			await this.readFilesToDataset(dataset);
		} catch (e) {
			// console.log(dataset.getSize())
			// console.log("Here")
			fs.removeSync(tempDir);

			return Promise.reject(new InsightError("Incorrectly formatted file or data from content: " + e));
		}
		try {
			await fs.ensureDir(persistDir);
			const data = {
				id: dataset.getId(),
				kind: InsightDatasetKind.Sections,
				size: dataset.getSize(),
				sections: dataset.getSections(),
			};
			await fs.writeJSON(persistDir + "/" + id + ".json", data);
		} catch (e) {
			fs.removeSync(tempDir);
			return Promise.reject(new InsightError("Unable to write dataset to file"));
		}

		this.datasets.set(id, true);
		// console.log(this.datasets)
		fs.removeSync(tempDir);
		let result: string[] = [];
		for (let k of this.datasets.keys()) {
			if (this.datasets.get(k)) {
				result.push(k);
			}
		}
		return Promise.resolve(result);
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
				let parsedQuery = new Query(query as JSONQuery);
				results = parsedQuery.execute();
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

	private async extractContent(id: string, content: string): Promise<void> {
		fs.ensureDir(tempDir);
		// console.log("Trying to add dataset to data");
		const stringBuffer = Buffer.from(content, "base64");
		const tempPath: string = tempDir + "/" + id;
		fs.ensureDir(tempPath);
		const zip = new JSZip();
		await zip
			.loadAsync(stringBuffer)
			.then(() => {
				return Promise.all(
					Object.keys(zip.files).map((filename: string) => {
						const file = zip.files[filename];
						const outputPath = tempPath + "/" + filename;

						if (file.dir) {
							return fs.ensureDir(outputPath);
						} else {
							return file.async("nodebuffer").then((fileContent: any) => {
								fs.writeFile(outputPath, fileContent);
							});
						}
					})
				);
			})
			.catch((error: Error) => {
				throw new InsightError("Unable to parse data");
			});

		// console.log("successfully added dataset to data");
		return Promise.resolve();
	}

	// addDataset helper function
	private async readFilesToDataset(dataset: Dataset): Promise<void> {
		return new Promise((resolve, reject) => {
			const coursesPath: string = tempDir + "/" + dataset.getId() + "/courses/";
			fs.readdir(coursesPath, function (err, files) {
				if (err) {
					return reject(new InsightError());
				}
				// console.log("start of forEach")
				files.forEach(function (file, index) {
					fs.readJson(coursesPath + file, function (err2, object) {
						if (err2) {
							return reject(new InsightError("Error reading JSON files in courses"));
						}
						if (object === undefined) {
							return reject(new InsightError("Database courses folder cannot be empty"));
						}
						let result;
						try {
							result = object["result"];
						} catch {
							return reject(new InsightError("Unable to find results"));
						}

						if (result === undefined || !Array.isArray(result)) {
							return reject(new InsightError("Contains file with undefined results property"));
						}

						// console.log(object)
						try {
							// console.log(result);
							dataset.addSections(result);
							// console.log("added sections")
						} catch {
							return reject(new InsightError("Invalid dataset"));
						}
						// console.log("file");
						// console.log("Here " + dataset.getSize())
						return resolve();
					});
				});
			});
		});
	}
}
