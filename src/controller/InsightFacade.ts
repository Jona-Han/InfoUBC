import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
} from "./IInsightFacade";
import Dataset from "./Dataset";
import * as fs from "fs-extra";
import {writeFileSync} from "fs";
import JSZip from "jszip";
const persistDir = "./data";
const tempDir = "./temp";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	private datasets: {[key: string]: Dataset};
	private keys: string[];

	constructor() {
		this.datasets = {};
		this.keys = [];
		console.log("InsightFacadeImpl::init()");
	}

	// 1. Check valid InsightDatasetKind
	// 2. Check valid id
	// 3. Check Valid content
	// 4. Add dataset
	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		return new Promise((resolve, reject) => {
			// Reject if InsightDatasetKind is not Sections
			if (kind !== InsightDatasetKind.Sections) {
				return reject(new InsightError("kind must be InsightDatasetKind.Sections"));
			}

			// Reject if ID is not valid
			if (this.isNotValidID(id)) {
				return reject(new InsightError("Invalid id"));
			}

			// Reject if a dataset with the same id is already present
			if (this.keys.includes(id)) {
				return reject(new InsightError("Key already present in dataset"));
			}

			// Try to write a file, otherwise reject
			fs.ensureDir(tempDir);
			console.log("Trying to add dataset to data");
			const stringBuffer = Buffer.from(content, "base64");
			const tempPath: string = tempDir + "/" + id;
			fs.ensureDir(tempPath);
			// fs.writeFileSync(zipPath, stringBuffer)
			const zip = new JSZip();
			zip.loadAsync(stringBuffer)
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
					return reject(new InsightError("Error loading data from content"));
				});

			console.log("successfully added dataset to data");
			// } catch {
			// 	console.log("Failed to add dataset to data")
			// 	return reject(new InsightError("Invalid content"))
			// }
			if (this.isValidDataset(content)) {
				return reject("Missing remaining implementation");
			}
			return reject(new InsightError("Not yet implemented"));
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
			// if (this.datasets === 0) {
			// 	reject(new InsightError("No datasets available for query"));
			// }
			if (this.isNotValidQuery(query)) {
				reject(new InsightError("Invalid query"));
			}
			reject("Not implemented");
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
