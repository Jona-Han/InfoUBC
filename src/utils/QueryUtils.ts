import Decimal from "decimal.js";
import {ApplyRule, ApplyToken, Sort} from "../models/IQuery";
import {InsightDatasetKind, InsightError} from "../controller/IInsightFacade";

export function validateKeyMatchesKind(key: string | undefined, kind: InsightDatasetKind | undefined) {
	const SectionFields = ["avg", "pass", "fail", "audit", "year", "dept", "id", "instructor", "title", "uuid"];
	const RoomFields = [
		"lat",
		"lon",
		"seats",
		"fullname",
		"shortname",
		"number",
		"name",
		"address",
		"type",
		"furniture",
		"href",
	];
	if (key === undefined) {
		throw new InsightError("Fatal error. Key undefined when validating match with dataset kind.");
	} else if (kind === undefined) {
		throw new InsightError("Fatal error. Dataset has no kind set.");
	} else if (kind === InsightDatasetKind.Sections && !SectionFields.includes(key.split("_")[1])) {
		throw new InsightError(`Invalid key: ${key}`);
	} else if (kind === InsightDatasetKind.Rooms && !RoomFields.includes(key.split("_")[1])) {
		throw new InsightError(`Invalid key: ${key}`);
	}
}

export function orderEntriesByString(
	entries: any[],
	orderKey: string,
	kind: InsightDatasetKind | undefined
): void {
	if (orderKey.includes("_")) {
		validateKeyMatchesKind(orderKey, kind);
		orderKey = orderKey.split("_")[1];
	}

	entries.sort((a, b) => {
		if (a[orderKey] < b[orderKey]) {
			return -1;
		} else if (a[orderKey] > b[orderKey]) {
			return 1;
		}
		return 0;
	});
}

export function orderEntriesBySortObject(
	entries: any[],
	orderObject: Sort,
	kind: InsightDatasetKind | undefined
): void {
	entries.sort((a, b) => {
		for (let key of orderObject.keys) {
			let orderKey = key;

			// If key in keys is a section or room key, keep only the part after "_"
			if (key.includes("_")) {
				validateKeyMatchesKind(orderKey, kind);
				orderKey = key.split("_")[1];
			}

			if (a[orderKey] < b[orderKey]) {
				return orderObject.dir === "UP" ? -1 : 1;
			} else if (a[orderKey] > b[orderKey]) {
				return orderObject.dir === "UP" ? 1 : -1;
			}
			// If equal, the loop will check the next key (tiebreaker)
		}
		return 0;
	});
}

export function applyRules(
	sections: any[],
	result: any,
	rules: ApplyRule[] | undefined,
	kind: InsightDatasetKind | undefined
): void {
	if (rules !== undefined) {
		rules.forEach((applyRule) => {
			const applyKey = Object.keys(applyRule)[0];
			const applyToken = Object.keys(applyRule[applyKey])[0] as ApplyToken;
			validateKeyMatchesKind(applyRule[applyKey][applyToken], kind);
			const field = applyRule[applyKey][applyToken]?.split("_")[1];

			let total = new Decimal(0);
			let sum;

			switch (applyToken) {
				case "MAX":
					result[applyKey] = Math.max(
						...sections.map((entry) => entry[field as string] as number)
					);
					break;
				case "MIN":
					result[applyKey] = Math.min(
						...sections.map((entry) => entry[field as string] as number)
					);
					break;
				case "AVG":
					sections.forEach((entry) => {
						total = total.add(new Decimal(entry[field as string] as number));
					});
					result[applyKey] = Number((total.toNumber() / sections.length).toFixed(2));
					break;
				case "SUM":
					sum = sections.reduce((acc, entry) => {
						return new Decimal(acc).add(new Decimal(entry[field as string] as number)).toNumber();
					}, 0);
					result[applyKey] = Number(sum.toFixed(2));
					break;
				case "COUNT":
					result[applyKey] = new Set(
						sections.map((entry) => entry[field as string] as number)
					).size;
					break;
			}
		});
	}
}
