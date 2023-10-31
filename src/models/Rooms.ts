import {InsightDatasetKind, InsightError} from "../controller/IInsightFacade";

export interface Room {
	number: string;
	name: string;
	seats: number;
	type: string;
	furniture: string;
	href: string;
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
	private buildings: Building[];

	constructor(id: string) {
		this.id = id;
		this.buildings = []
	}

	public getID(): string {
		return this.id;
	}

	public getRooms(): Building[] {
		return this.buildings
	}

	// Searches nodes for links to building files
	public addBuildings(index: any): Map<string, string | number>[] {
		let buildings = []
		let tables = this.findTags(index, 'table')
		for (const table of tables) {
			let rows = this.findTags(table, 'tr')
			for (let row of rows) {
				let building = this.addBuilding(row)
				buildings.push(building)
			}
		}
		return buildings
	}

	

	private addBuilding(buildingRow: any): Map<string, string | number> {
		let cells = this.findTags(buildingRow, 'td')
		let building: Map<string, string | number> = new Map();
		for (let cell of cells)	{
			this.extractBuildingDetails(cell, building)
		}
		return building
	}

	private extractBuildingDetails(cell: any, building: Map<string, string | number>): void {
		let attributes = cell.attrs
		if (attributes) {
			for (let attribute of attributes) {
				if (attribute.name && attribute.name === 'class' && attribute.value) {
					if (attribute.value === 'views-field views-field-field-building-code') {
						building.set('shortname', cell.childNodes[0].value.replace("\n", "").trim())
					} else if (attribute.value === 'views-field views-field-title') {
						let links: any[] = this.findTags(cell, 'a');
						if (links.length > 0) {
							building.set('fullname', links[0].childNodes[0].value.replace("\n", "").trim())
							let linkAttributes = links[0].attrs
							for (let linkAttribute of linkAttributes) {
								if (linkAttribute.name && linkAttribute.name == 'href') {
									building.set('href', linkAttribute.value.replace("./", ""))
								}
							}
						}
						// building.set('fullname', cell.childNodes[0].childNodes[0].value)
						
					} else if (attribute.value === 'views-field views-field-field-building-address') {
						building.set('address', cell.childNodes[0].value.replace("\n", "").trim())
					}
				}
			}
		}
	}

	public addRooms(buildingContent: any, building: Map<string, string | number | Map<string, string | number>[]>) {
		let rooms: Map<string, string | number>[] = []
		let tables = this.findTags(buildingContent, 'table')
		for (const table of tables) {
			let rows = this.findTags(table, 'tr')
			for (let row of rows) {
				let room = this.addRoom(row)
				let shortname = building.get('shortname');
				let number = room.get('number')
				if (shortname !== undefined && number != undefined) {
					let name = shortname + "_" + number
					room.set('name', name)
				}
				rooms.push(room)
			}
		}
		building.set('rooms', rooms)
	}

	private addRoom(row: any): Map<string, string | number> {
		let room: Map<string, string | number> = new Map()
		let cells = this.findTags(row, 'td');
		for (const cell of cells) {
			this.extractRoomDetails(cell, room)
		}
		let shortname = room.get('shortname')
		let number = room.get('number')
		return room;
	}

	private extractRoomDetails(cell: any, room: Map<string, string | number>): void {
		let attributes = cell.attrs
		if (attributes) {
			for (let attribute of attributes) {
				
				if (attribute.name && attribute.name === 'class' && attribute.value) {
					// console.log(attribute)
					if (attribute.value === 'views-field views-field-field-room-capacity') {
						// console.log(cell.childNodes[0].childNodes[0].value)
						room.set('seats', cell.childNodes[0].value.replace("\n", "").trim())
					} else if (attribute.value === 'views-field views-field-field-room-number') {
						let links: any[] = this.findTags(cell, 'a');
						if (links.length > 0) {
							room.set('number', links[0].childNodes[0].value.replace("\n", "").trim())
							let linkAttributes = links[0].attrs
							for (let linkAttribute of linkAttributes) {
								if (linkAttribute.name && linkAttribute.name == 'href') {
									room.set('href', linkAttribute.value)
								}
							}
						}						
					} else if (attribute.value === 'views-field views-field-field-room-furniture') {
						room.set('furniture', cell.childNodes[0].value.replace("\n", "").trim())
					} else if (attribute.value === 'views-field views-field-field-room-type') {
						room.set('type', cell.childNodes[0].value.replace("\n", "").trim())
					}
				}
			}
		}
	}

	private findTags(node: any, tag: string): any[] {
		let result = []
		let todo = [node];
		while (todo.length > 0) {
			let curr = todo.pop();
			if (curr.childNodes) {
				for (let child of curr.childNodes) {
					todo.push(child);
				}
			}
			if (curr.nodeName === tag) {
				result.push(curr)
			}
		}
		return result;
	}
}
