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
const persistDir = "./data";
const tempDir = "./temp";
import QueryValidator from "../utils/QueryValidator";
import {Query} from "../models/Query";
import {JSONQuery} from "../models/IQuery";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	private datasets: Map<string, Dataset>;

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
		if (this.datasets.has(id)) {
			return Promise.reject(new InsightError("Key already present in dataset"));
		}

		// Try to extract content and put in ./temp/id
		const dataset = new Dataset(id);
		try {
			await this.extractContent(id, content);
		} catch {
			fs.removeSync(tempDir);
			return Promise.reject(new InsightError("Unable to extract data from content"));
		}
		try {
			fs.removeSync(tempDir);
			await this.readFilesToDataset(dataset);
		} catch {
			fs.removeSync(tempDir);
			return Promise.reject(new InsightError("Incorrectly formatted file or data from content"));
		}
		try {
			await fs.ensureDir(persistDir);
			const data = {
				id: dataset.getId(),
				kind: InsightDatasetKind.Sections,
				size: dataset.getSize(),
				sections: dataset.getSections,
			};
			await fs.writeJSON(persistDir + "/" + id + ".json", JSON.stringify(data));
		} catch {
			return Promise.reject(new InsightError("Unable to write dataset to file"));
		}

		return Promise.resolve(["Stub"]);
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
		console.log("Trying to add dataset to data");
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
							return file.async("nodebuffer").then((filecontent: any) => {
								fs.writeFile(outputPath, filecontent);
							});
						}
					})
				);
			})
			.catch((error: Error) => {
				throw new InsightError("Unable to parse data");
			});
		console.log("successfully added dataset to data");
		return Promise.resolve();
	}

	// addDataset helper function
	private readFilesToDataset(dataset: Dataset): Promise<void> {
		return new Promise((resolve, reject) => {
			const coursesPath: string = tempDir + "/" + dataset.getId() + "/courses/";
			fs.readdir(coursesPath, function (err, files) {
				if (err) {
					return reject(new InsightError());
				}
				let check: number = 0;
				// console.log("start of forEach")
				files.forEach(function (file, index) {
					fs.readJson(coursesPath + file, function (err2, object) {
						if (err2) {
							return reject(new InsightError("Error reading JSON files in courses"));
						}
						let result = object["result"];
						if (result === undefined) {
							return reject(new InsightError("Contains file with undefined results property"));
						}

						// console.log(object)
						dataset.addSections(object["result"]);
						check++;
						// console.log("file");
					});
				});
				if (!check) {
					throw new InsightError("courses file should not be empty");
				}
			});
			return resolve();
		});
	}
}
