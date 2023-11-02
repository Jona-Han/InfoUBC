import {InsightDatasetKind, InsightError} from "../controller/IInsightFacade";

/**
 * KeyValidator class to handle key validation and dataset name management.
 */
export default class KeyValidator {
	private dataset: string;
	private transformationKeys: Set<string>;

	/**
	 * Initializes the dataset name as an empty string
	 * and the transformation keys as an empty set.
	 */
	constructor() {
		this.dataset = "";
		this.transformationKeys = new Set();
	}

	/**
	 * @return {string} The current dataset name.
	 */
	public getDatasetName(): string {
		return this.dataset;
	}

	/**
	 * Adds a key to the transformationKeys set.
	 * Used for testing purposes.
	 * @param {string} input - Key to add to the transformation keys.
	 */
	public addToTransformationKeys(input: string) {
		this.transformationKeys.add(input);
	}

	/**
	 * Validates a MKey (metric key).
	 * @param {string} input - The MKey to validate.
	 * @return {boolean} True if the key is valid, false otherwise.
	 */
	public validateMKey(input: string): boolean {
		const mKeyPattern = /^[^_]+_(avg|pass|fail|audit|year|lat|lon|seats)$/;
		if (!mKeyPattern.test(input)) {
			return false;
		}
		this.checkForMultipleDataset(input);
		return true;
	}

	/**
	 * Validates a SKey (string key).
	 * @param {string} input - The SKey to validate.
	 * @return {boolean} True if the key is valid, false otherwise.
	 */
	public validateSKey(input: string): boolean {
		const sKeyPattern =
			/^[^_]+_(dept|id|instructor|title|uuid|fullname|shortname|number|name|address|type|furniture|href)$/;
		if (!sKeyPattern.test(input)) {
			return false;
		}
		this.checkForMultipleDataset(input);
		return true;
	}

	/**
	 * Checks if the input key is from a different dataset.
	 * @param {string} input - The key to check.
	 * @throws {InsightError} If the key is from a different dataset.
	 */
	public checkForMultipleDataset(input: string): void {
		const [contentName] = input.split("_");
		if (this.dataset === "") {
			this.dataset = contentName;
		} else if (this.dataset !== contentName) {
			throw new InsightError("Cannot query from multiple datasets");
		}
	}

	/**
	 * Validates a key used in the GROUP of a TRANSFORMATION.
	 * @param {string | undefined} input - The key to validate.
	 * @return {boolean} True if valid, false otherwise.
	 */
	public validateGroupKey(input: string | undefined): boolean {
		if (typeof input === "undefined") {
			return false;
		}
		if (!this.validateMKey(input) && !this.validateSKey(input)) {
			return false;
		}
		this.transformationKeys.add(input);
		return true;
	}

	/**
	 * Validates a key used in the COLUMNS of a query.
	 * @param {string} columnKey - The column key to validate.
	 * @throws {InsightError} If the key is invalid.
	 */
	public validateColumnKey(columnKey: string) {
		if (this.transformationKeys.size !== 0) {
			if (!this.transformationKeys.has(columnKey)) {
				throw new InsightError("Keys in COLUMNS must be in GROUP or APPLY when TRANSFORMATIONS is present");
			}
			return;
		} else if (!this.validateMKey(columnKey) && !this.validateSKey(columnKey)) {
			throw new InsightError(`Invalid key in COLUMNS: ${columnKey}`);
		}
	}

	/**
	 * Validates a target key used in an APPLY rule.
	 * @param {string} input - The target key to validate.
	 * @return {boolean} True if the key is valid, false otherwise.
	 */
	public validateApplyRuleTargetKey(input: string) {
		if (typeof input === "undefined") {
			return false;
		}
		return this.validateMKey(input) || this.validateSKey(input);
	}

	/**
	 * Validates that a key used in ORDER is present in the COLUMNS of a query.
	 * @param {any} key - The key to validate.
	 * @param {string[]} columnKeys - List of keys from the COLUMNS of a query.
	 * @throws {InsightError} If the key is not present in the columnKeys.
	 */
	public validateOrderKey(key: any, columnKeys: string[]) {
		if (!columnKeys.includes(key)) {
			throw new InsightError("All ORDER keys must be in COLUMNS");
		}
	}

	/**
	 * Validates a key used in APPLY.
	 * @param {string} applyKey - The apply key to validate.
	 * @throws {InsightError} If the key is invalid or not unique.
	 */
	public validateApplyKey(applyKey: string): void {
		const pattern = /^[^_]+$/;
		if (!pattern.test(applyKey)) {
			throw new InsightError("Cannot have underscore in applyKey");
		}
		if (this.transformationKeys.has(applyKey)) {
			throw new InsightError(`Duplicate APPLY key ${applyKey}`);
		}
		this.transformationKeys.add(applyKey);
	}
}
