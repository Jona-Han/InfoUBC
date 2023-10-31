import {InsightDatasetKind, InsightError} from "../controller/IInsightFacade";
import {Document} from "parse5/dist/tree-adapters/default";

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

export default class Rooms {
	private id: string;
	private rooms: Room[];
	private size: number;
	private urlPrefix = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team123/";

	constructor(id: string) {
		this.id = id;
		this.rooms = [];
		this.size = 0;
	}

	public getId(): string {
		return this.id;
	}

	public getRooms(): Room[] {
		return this.rooms;
	}

	public getSections(): Room[] {
		return this.rooms;
	}

	public getSize(): number {
		return this.size;
	}

	// Searches nodes for links to building files
	public addBuildings(index: any): Array<Map<string, string | undefined>> {
		let buildings = [];
		let tables = this.findTags(index, 'table');
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
		return (
			building.get("fullname") !== undefined &&
			building.get("shortname") !== undefined &&
			building.get("address") !== undefined
		);
	}

	private addBuilding(row: any): Map<string, string | undefined> {
		let building: Map<string, string | undefined> = new Map();
		building.set('address', this.findClassValue(row, "views-field views-field-field-building-address"))
		building.set('shortname', this.findClassValue(row, "views-field views-field-field-building-code"))
		building.set('fullname', this.findClassValue(row, "views-field views-field-title"))
		building.set('href', this.findHref(row)?.replace('./', ''))
		// console.log(building)
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
			// console.log(building)
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
						lon: building.get("lat"),
					};
					this.rooms.push(roomData);
					this.size++;
					// console.log(roomData)
				}
			}
		}
	}

	private isValidRoom(room: Map<string, string | number | undefined>): boolean {
		let result = room.get("number") !== undefined && typeof room.get("number") === "string";
		result &&= room.get("seats") !== undefined && typeof room.get("seats") === "number";
		result &&= room.get("name") !== undefined && typeof room.get("name") === "string";
		result &&= room.get("type") !== undefined && typeof room.get("type") === "string";

		result &&= room.get("furniture") !== undefined && typeof room.get("furniture") === "string";

		return result && room.get("href") !== undefined && typeof room.get("href") === "string";
	}

	private addRoom(row: any): Map<string, string | number | undefined> {
		let room: Map<string, string | number | undefined> = new Map();

		room.set('seats', Number(this.findClassValue(row, "views-field views-field-field-room-capacity")))
		room.set('furniture', this.findClassValue(row, "views-field views-field-field-room-furniture"))
		room.set('number', this.findClassValue(row, "views-field views-field-field-room-number"))
		room.set('type', this.findClassValue(row, "views-field views-field-field-room-type"))
		room.set('href', this.findHref(row))
		// console.log(room)
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
			// console.log(curr)
			// console.log(curr)
			if (curr.childNodes.length === 1) {
				curr = curr.childNodes[0]
			} else {
				curr = curr.childNodes[1]
			}
		}
		// console.log(curr)
		return curr
	}

	private findClassValue(node: any, className: string): string | undefined{
		let cells = this.findTags(node, 'td')
		// console.log(cells)
		for (let cell of cells) {
			// console.log(cell)
			let attributes = cell.attrs
			if (attributes) {
				for (let attribute of attributes) {
					// console.log(attribute)
					if (attribute.name && attribute.name === 'class' && attribute.value && attribute.value === className) {
						// console.log(this.findFirstLeaf(cell).value)
						return this.findFirstLeaf(cell).value.replace("\n", "").trim();
					}
				}
			}
		}
		return undefined
	}

	private findHref(node: any): string | undefined {
		let potentialLinks = this.findTags(node, 'a')
		for (let link of potentialLinks) {
			let attributes = link.attrs
			if (attributes) {
				for (let attribute of attributes) {
					if (attribute.name && attribute.name === 'href') {
						return attribute.value
					}

				}
			}
		}
		return undefined
	}

	public async getGeolocations(buildings: Array<Map<string, string>>): Promise<void> {
		let promises = [];
		for (let building of buildings) {
			let address = building.get("address");
			if (address !== undefined) {
				address = address.replaceAll(" ", "%20");
				let url = this.urlPrefix + address;
				// console.log(url)
				try {
					let promise = fetch(url)
						.then((geoResponse) => {
							console.log(geoResponse)
						})
						.then((stuff) => {
							// console.log(stuff)
						})
						.catch();
					promises.push(promise);
				} catch {
					// Do nothing
				}
			}
		}
		let results = Promise.all(promises);
		await results;
		// console.log(results)
	}
}
