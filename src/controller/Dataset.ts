import Section from "./Section";

export default class Dataset {
	private id: string;
	private size: number;
	private sections: Section[];

	constructor() {
		this.id = "";
		this.size = 0;
		this.sections = [];
	}
}
