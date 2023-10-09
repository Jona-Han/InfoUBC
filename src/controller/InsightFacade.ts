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
	private datasets: Map<string, InsightDataset | false>;

	constructor() {
		this.datasets = new Map();
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
		if (this.datasets.get(id) !== undefined && this.datasets.get(id)) {
			return Promise.reject(new InsightError("Key already present in dataset"));
		}
		// Try to extract content and put in ./temp/id
		let dataset = new Dataset(id);

		try {
			// console.log("1. before ensure tempDir")
			await fs.ensureDir(tempDir);
			// console.log("2. before extractContent")
			await this.extractContent(id, content);
			// console.log("3. before readFilesToDataset")
			await this.readFilesToDataset(dataset);
			// console.log("4. after readFilesToDataset")
			// console.log(dataset.getSize());
			if (dataset.getSize() < 1) {
				// console.log("We here")
				throw new InsightError("No valid sections");
			}
			// console.log("before ensureDir(persistDir)")
			await fs.ensureDir(persistDir);
			const data = {
				id: dataset.getId(),
				kind: InsightDatasetKind.Sections,
				numRows: dataset.getSize(),
				sections: dataset.getSections(),
			};
			// console.log("before writing to file")
			await fs.writeJSON(persistDir + "/" + id + ".json", data);
			const data2: InsightDataset = {
				id: data.id,
				kind: data.kind,
				numRows: data.numRows,
			};
			this.datasets.set(id, data2);
			fs.removeSync(tempDir);
			let result: string[] = [];
			for (let k of this.datasets.keys()) {
				if (this.datasets.get(k)) {
					result.push(k);
				}
			}
			return Promise.resolve(result);
		} catch (e) {
			// console.log(dataset.getSize());
			// console.log(e);
			// fs.ensureDirSync(tempDir);
			// console.log("4e")
			await fs.remove(tempDir);
			return Promise.reject(new InsightError("" + e));
		}
	}

	// 1. Check valid id
	// 2. Check id is in dataset
	// 3. Remove dataset
	public async removeDataset(id: string): Promise<string> {
		if (this.isNotValidID(id)) {
			return Promise.reject(new InsightError("Invalid id"));
			// } if (this.datasets.contains(id)) {
			// 	reject(new NotFoundError("ID not present in dataset"))
		}
		if (!this.datasets.get(id)) {
			return Promise.reject(new NotFoundError("ID not present in dataset"));
		}

		try {
			await fs.remove(persistDir + "/" + id + ".json");
			this.datasets.set(id, false);
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
			for (let dataset of this.datasets.values()) {
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
				this.datasets.set(file, data);
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

	private async extractContent(id: string, content: string): Promise<void> {
		// console.log("Trying to add dataset to data");
		const stringBuffer = Buffer.from(content, "base64");
		const tempPath: string = tempDir + "/" + id;
		// console.log("2.1: before ensuring tempPath")
		await fs.ensureDir(tempPath);
		const zip = new JSZip();
		// console.log("2.2: before AsyncLoad")
		await zip
			.loadAsync(stringBuffer)
			.then(() => {
				return Promise.all(
					Object.keys(zip.files).map((filename: string) => {
						// console.log("2.3")
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
				return new InsightError("Unable to parse data");
			});

		// console.log("end of extract content");
		return Promise.resolve();
	}

	// addDataset helper function
	private async readFilesToDataset(dataset: Dataset): Promise<void> {
		// console.log("3.1")
		const coursesPath: string = tempDir + "/" + dataset.getId() + "/courses/";
		try {
			let files = await fs.readdir(coursesPath);
			// console.log("3.2a: before ensuring tempPath")

			let filesToRead = [];
			for (let file of files) {
				let thisPromise = fs
					.readJson(coursesPath + file)
					.then((object) => {
						try {
							// console.log("3.3")
							let result = object["result"];
							dataset.addSections(result);
						} catch {
							// do nothing
						}
					})
					.catch((e) => Promise.reject(new InsightError(e)));
				// console.log("3.3-1")
				filesToRead.push(thisPromise);
				// console.log("3.3-2")
			}

			let promises = Promise.all(filesToRead);
			await promises;

			// console.log("3.4")
			// console.log("3.5")
			return Promise.resolve();
		} catch (e) {
			// console.log("3.2")
			return Promise.reject(new InsightError("" + e));
		}
	}
}
