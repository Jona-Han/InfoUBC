import {InsightDatasetKind, InsightError} from "../controller/IInsightFacade";

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
	public addBuildings(index: any): Array<Map<string, string>> {
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

	private buildingIsValid(building: Map<string, string>): boolean {
		return (
			building.get("fullname") !== undefined &&
			building.get("shortname") !== undefined &&
			building.get("address") !== undefined
		);
	}

	private addBuilding(buildingRow: any): Map<string, string> {
		let cells = this.findTags(buildingRow, "td");
		let building: Map<string, string> = new Map();
		for (let cell of cells) {
			this.extractBuildingDetails(cell, building);
		}
		return building;
	}

	private extractBuildingDetails(cell: any, building: Map<string, string | number>): void {
		let attributes = cell.attrs;
		if (attributes) {
			for (let attribute of attributes) {
				if (attribute.name && attribute.name === "class" && attribute.value) {
					if (attribute.value === "views-field views-field-field-building-code") {
						building.set("shortname", cell.childNodes[0].value.replace("\n", "").trim());
					} else if (attribute.value === "views-field views-field-title") {
						let links: any[] = this.findTags(cell, "a");
						if (links.length > 0) {
							building.set("fullname", links[0].childNodes[0].value.replace("\n", "").trim());
							let linkAttributes = links[0].attrs;
							for (let linkAttribute of linkAttributes) {
								if (linkAttribute.name && linkAttribute.name === "href") {
									building.set("href", linkAttribute.value.replace("./", ""));
								}
							}
						}
						// building.set('fullname', cell.childNodes[0].childNodes[0].value)
					} else if (attribute.value === "views-field views-field-field-building-address") {
						building.set("address", cell.childNodes[0].value.replace("\n", "").trim());
					}
				}
			}
		}
	}

	public addRooms(buildingContent: any, building: Map<string, string | any[]>) {
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

	private isValidRoom(room: Map<string, string | number>): boolean {
		let result = room.get("number") !== undefined && typeof room.get("number") === "string";
		result &&= room.get("seats") !== undefined && typeof room.get("seats") === "number";
		result &&= room.get("name") !== undefined && typeof room.get("name") === "string";
		result &&= room.get("type") !== undefined && typeof room.get("type") === "string";

		result &&= room.get("furniture") !== undefined && typeof room.get("furniture") === "string";

		return result && room.get("href") !== undefined && typeof room.get("href") === "string";
	}

	private addRoom(row: any): Map<string, string | number> {
		let room: Map<string, string | number> = new Map();
		let cells = this.findTags(row, "td");
		for (const cell of cells) {
			this.extractRoomDetails(cell, room);
		}
		return room;
	}

	private extractRoomDetails(cell: any, room: Map<string, string | number>): void {
		let attributes = cell.attrs;
		if (attributes) {
			for (let attribute of attributes) {
				if (attribute.name && attribute.name === "class" && attribute.value) {
					// console.log(attribute)
					if (attribute.value === "views-field views-field-field-room-capacity") {
						// console.log(cell.childNodes[0].childNodes[0].value)
						room.set("seats", Number(cell.childNodes[0].value.replace("\n", "").trim()));
					} else if (attribute.value === "views-field views-field-field-room-number") {
						let links: any[] = this.findTags(cell, "a");
						if (links.length > 0) {
							room.set("number", links[0].childNodes[0].value.replace("\n", "").trim());
							let linkAttributes = links[0].attrs;
							for (let linkAttribute of linkAttributes) {
								if (linkAttribute.name && linkAttribute.name === "href") {
									room.set("href", linkAttribute.value);
								}
							}
						}
					} else if (attribute.value === "views-field views-field-field-room-furniture") {
						room.set("furniture", cell.childNodes[0].value.replace("\n", "").trim());
					} else if (attribute.value === "views-field views-field-field-room-type") {
						room.set("type", cell.childNodes[0].value.replace("\n", "").trim());
					}
				}
			}
		}
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
							// console.log(geoResponse)
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
