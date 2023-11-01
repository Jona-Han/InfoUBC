import {InsightError} from "../controller/IInsightFacade";

export default class KeyValidator {
	public dataset: string;
	public keys: Set<string>;
	public transformationKeys: Set<string>;

	constructor() {
		this.dataset = "";
		this.keys = new Set();
		this.transformationKeys = new Set();
	}

	public setDatasetName(input: string) {
		this.dataset = input;
	}

	public getDatasetName(): string {
		return this.dataset;
	}

	public validateMKey(input: string): boolean {
		const mKeyPattern = /^[^_]+_(avg|pass|fail|audit|year|lat|lon|seats)$/;
		if (!mKeyPattern.test(input)) {
			return false;
		}

		this.checkForMultipleDataset(input);
		return true;
	}

	public validateSKey(input: string): boolean {
		const sKeyPattern =
			/^[^_]+_(dept|id|instructor|title|uuid|fullname|shortname|number|name|address|type|furniture|href)$/;
		if (!sKeyPattern.test(input)) {
			return false;
		}
		this.checkForMultipleDataset(input);
		return true;
	}

	public checkForMultipleDataset(input: string) {
		const [contentName, key] = input.split("_");
		if (this.dataset === "") {
			this.dataset = contentName;
		} else if (this.dataset !== contentName) {
			throw new InsightError("Cannot query from multiple datasets");
		}
		this.keys.add(key);
	}

	public validateKey(input: string | undefined): boolean {
		if (typeof input === "undefined") {
			return false;
		}
		if (!this.validateMKey(input) && !this.validateSKey(input) && !this.transformationKeys.has(input)) {
			return false;
		}
		this.transformationKeys.add(input);
		return true;
	}

	public validateColumnKey(columnKey: string) {
		if (this.transformationKeys.size !== 0 && !this.transformationKeys.has(columnKey)) {
			throw new InsightError("Keys in COLUMNS must be in GROUP or APPLY when TRANSFORMATIONS is present");
		}

		if (!this.validateMKey(columnKey) && !this.validateSKey(columnKey) && !this.transformationKeys.has(columnKey)) {
			throw new InsightError(`Invalid key: ${columnKey}`);
		}
	}

	public validateApplyRuleTargetKey(input: string) {
		if (typeof input === "undefined") {
			return false;
		}
		return (this.validateMKey(input) || this.validateSKey(input) || this.transformationKeys.has(input));
	}

	public validateOrderKey(input: string) {
		if (typeof input === "undefined") {
			return false;
		}
		return (this.validateMKey(input) || this.validateSKey(input) || this.transformationKeys.has(input));
	}

	public validateApplyKey(applyKey: string): void {
		const pattern = /^[^_]+$/;
		if (!pattern.test(applyKey)) {
			throw new InsightError("Cannot have underscore in applyKey");
		}

		if (this.keys.has(applyKey)) {
			throw new InsightError(`Duplicate APPLY key ${applyKey}`);
		}
		this.transformationKeys.add(applyKey);
		this.keys.add(applyKey);
	}
}
