import {InsightDatasetKind, InsightError} from "../controller/IInsightFacade";
import {Document} from "parse5/dist/tree-adapters/default";
import Http from "node:http";
import {Dataset} from "./Dataset";

export interface Room {
	number: string;
	name: string;
	seats: number;
	type: string;
	furniture: string;
	href: string;
	fullname: string;
	shortname: string;
	address: string;
	lat: number;
	lon: number;
}

export interface Building {
	fullname: string;
	shortname: string;
	address: string;
	lat: number;
	lon: number;
	rooms: Room[];
}

export default class Rooms extends Dataset {
	private rooms: Room[];
	private urlPrefix: string = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team123/";

	constructor(id: string) {
		super(id, InsightDatasetKind.Rooms);
		this.rooms = [];
	}

	public getData(): Room[] {
		return this.rooms;
	}

	public getDataAsMap(): Map<string, any> {
		const map = new Map<string, Room>();
		this.rooms.forEach((room) => {
			map.set(room.href, room);
		});
		return map;
	}

	public addDataFromJSON(fileData: any[]): void {
		if (fileData === undefined) {
			throw new InsightError("No valid rooms");
		}
		for (let room of fileData) {
			this.addAlreadyValidRoom(room);
		}
	}

	private addAlreadyValidRoom(room: any) {
		if (room !== undefined) {
			this.rooms.push(room as Room);
			this.size++;
		}
	}

	// Searches nodes for links to building files
	public addBuildings(index: any): Array<Map<string, string | undefined>> {
		let buildings = [];
		let tables = this.findTags(index, "table");
		for (const table of tables) {
			let rows = this.findTags(table, "tr");
			for (let row of rows) {
				let building = this.addBuilding(row);
				if (this.buildingIsValid(building)) {
					buildings.push(building);
				}
			}
		}
		return buildings;
	}

	private buildingIsValid(building: Map<string, string | undefined>): boolean {
		const requiredKeys = ["shortname", "fullname", "address"];
		for (let key of requiredKeys) {
			if (building.get(key) === undefined) {
				return false;
			}
		}
		return true;
	}

	private addBuilding(row: any): Map<string, string | undefined> {
		let building: Map<string, string | undefined> = new Map();
		building.set("address", String(this.findClassValue(row, "views-field views-field-field-building-address")));
		building.set("shortname", String(this.findClassValue(row, "views-field views-field-field-building-code")));
		building.set("fullname", String(this.findClassValue(row, "views-field views-field-title")));
		building.set("href", String(this.findHref(row)?.replace("./", "")));
		return building;
	}

	public addRooms(buildingContent: any, building: Map<string, string | any[] | undefined>) {
		let rooms = [];
		let tables = this.findTags(buildingContent, "table");
		for (const table of tables) {
			let rows = this.findTags(table, "tr");
			for (let row of rows) {
				let room = this.addRoom(row);
				let shortname = building.get("shortname");
				let number = room.get("number");
				if (shortname !== undefined && number !== undefined) {
					let name = shortname + "_" + number;
					room.set("name", name);
				}
				if (this.isValidRoom(room)) {
					rooms.push(room);
				}
			}
		}
		building.set("rooms", rooms);
	}

	public update(buildings: any[]): void {
		for (let building of buildings) {
			let rooms = building.get("rooms");
			if (building.get("lat") === undefined) {
				continue;
			}
			if (rooms !== undefined && rooms.length > 0) {
				for (let room of rooms) {
					let roomData: Room = {
						number: room.get("number"),
						name: room.get("name"),
						seats: room.get("seats"),
						type: room.get("type"),
						furniture: room.get("furniture"),
						href: room.get("href"),
						fullname: building.get("fullname"),
						shortname: building.get("shortname"),
						address: building.get("address"),
						lat: building.get("lat"),
						lon: building.get("lon"),
					};
					this.rooms.push(roomData);
					this.size++;
				}
			}
		}
	}

	private isValidRoom(room: Map<string, string | number | undefined>): boolean {
		let requiredKeys = ["number", "name", "seats", "type", "furniture", "href"];
		for (let key of requiredKeys) {
			if (room.get(key) === undefined) {
				return false;
			}
		}
		if (isNaN(Number(room.get("seats")))) {
			return false;
		}
		return true;
	}

	private addRoom(row: any): Map<string, string | number | undefined> {
		let room: Map<string, string | number | undefined> = new Map();

		room.set("seats", Number(this.findClassValue(row, "views-field views-field-field-room-capacity")));
		room.set("furniture", String(this.findClassValue(row, "views-field views-field-field-room-furniture")));
		room.set("number", String(this.findClassValue(row, "views-field views-field-field-room-number")));
		room.set("type", String(this.findClassValue(row, "views-field views-field-field-room-type")));
		room.set("href", String(this.findHref(row)));
		return room;
	}

	private findTags(node: any, tag: string): any[] {
		let result = [];
		let todo = [node];
		while (todo.length > 0) {
			let curr = todo.pop();
			if (curr.childNodes) {
				for (let child of curr.childNodes) {
					todo.push(child);
				}
			}
			if (curr.nodeName === tag) {
				result.push(curr);
			}
		}
		return result;
	}

	private findFirstLeaf(node: any): any {
		let curr = node;
		while (curr.childNodes && curr.childNodes.length > 0) {
			if (curr.childNodes.length === 1) {
				curr = curr.childNodes[0];
			} else {
				curr = curr.childNodes[1];
			}
		}
		return curr;
	}

	private findClassValue(node: any, className: string): string | undefined {
		let cells = this.findTags(node, "td");
		for (let cell of cells) {
			let attributes = cell.attrs;
			if (attributes) {
				for (let attribute of attributes) {
					if (
						attribute.name &&
						attribute.name === "class" &&
						attribute.value &&
						attribute.value === className
					) {
						return this.findFirstLeaf(cell).value.replace("\n", "").trim();
					}
				}
			}
		}
		return undefined;
	}

	private findHref(node: any): string | undefined {
		let potentialLinks = this.findTags(node, "a");
		for (let link of potentialLinks) {
			let attributes = link.attrs;
			if (attributes) {
				for (let attribute of attributes) {
					if (attribute.name && attribute.name === "href") {
						return attribute.value;
					}
				}
			}
		}
		return undefined;
	}

	public async getGeolocations(buildings: Array<Map<string, string | undefined>>): Promise<void> {
		let promises = [];
		for (let building of buildings) {
			let address = building.get("address");
			if (address !== undefined) {
				try {
					address = address.replace(" ", "%20");
					let promise = new Promise((resolve, reject) => {
						Http.get(this.urlPrefix + address, (response: any) => {
							let body = "";
							response.on("data", (chunk: any) => {
								body += chunk;
							});
							response.on("end", () => {
								let result = JSON.parse(body);
								building.set("lat", result["lat"]);
								building.set("lon", result["lon"]);
								resolve(body);
							});
						}).on("error", function (e) {
							resolve(undefined);
						});
					});

					promises.push(promise);
				} catch (e) {
					// Do nothing
				}
			}
		}
		return Promise.all(promises).then();
	}
}
