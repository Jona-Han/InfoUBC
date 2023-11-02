import {Sort} from "../query/IQuery";
import {InsightDatasetKind, InsightError} from "../controller/IInsightFacade";

/**
 * Validates if the given key matches the expected fields based on the dataset kind.
 * @param {string | undefined} key - The key to be validated.
 * @param {InsightDatasetKind | undefined} kind - The kind of dataset being considered.
 * @throws {InsightError} If key or kind is undefined, or if the key does not match the dataset kind.
 */
export function validateKeyMatchesKind(key: string | undefined, kind: InsightDatasetKind | undefined): void {
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

	// Handle undefined key or kind cases
	if (key === undefined || kind === undefined) {
		const errorMessage =
			key === undefined ? "Key undefined when validating match with dataset kind." : "Dataset has no kind set.";
		throw new InsightError(`Fatal error. ${errorMessage}`);
	}
	// Validate key against dataset kind
	const field = key.split("_")[1];
	if (
		(kind === InsightDatasetKind.Sections && !SectionFields.includes(field)) ||
		(kind === InsightDatasetKind.Rooms && !RoomFields.includes(field))
	) {
		throw new InsightError(`Invalid key: ${key}`);
	}
}

/**
 * Orders the given entries based on a specified key in ascending order.
 * @param {any[]} entries - The array of entries to be sorted.
 * @param {string} key - The key by which entries should be sorted.
 * @param {InsightDatasetKind | undefined} kind - The kind of dataset being considered.
 */
export function orderEntriesByString(entries: any[], key: string, kind: InsightDatasetKind | undefined): void {
	let orderKey = key;

	// Extract the actual field name if the key is prefixed with dataset type
	if (orderKey.includes("_")) {
		validateKeyMatchesKind(orderKey, kind);
		orderKey = orderKey.split("_")[1];
	}

	// Sort entries
	entries.sort((a, b) => (a[orderKey] < b[orderKey] ? -1 : a[orderKey] > b[orderKey] ? 1 : 0));
}

/**
 * Orders the given entries based on the provided sort object.
 * @param {any[]} entries - The array of entries to be sorted.
 * @param {Sort} orderObject - The sort object containing direction and keys to order by.
 * @param {InsightDatasetKind | undefined} kind - The kind of dataset being considered.
 */
export function orderEntriesBySortObject(
	entries: any[],
	orderObject: Sort,
	kind: InsightDatasetKind | undefined
): void {
	entries.sort((a, b) => {
		for (let key of orderObject.keys) {
			let orderKey = key;

			// Extract the actual field name if the key is prefixed with dataset type
			if (key.includes("_")) {
				validateKeyMatchesKind(orderKey, kind);
				orderKey = key.split("_")[1];
			}

			// Compare values and return based on sort direction
			if (a[orderKey] !== b[orderKey]) {
				return a[orderKey] < b[orderKey]
					? orderObject.dir === "UP"
						? -1
						: 1
					: orderObject.dir === "UP"
						? 1
						: -1;
			}
		}
		// If entries are equal for all keys, they are considered the same
		return 0;
	});
}
