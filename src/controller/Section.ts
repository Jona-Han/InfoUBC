// A valid section containing all required keys of appropriate types
export default class Section {
	private id: string;
	private Course: string;
	private Title: string;
	private Professor: string;
	private Subject: string;
	private year: number;
	private Avg: number;
	private Pass: number;
	private Fail: number;
	private Audit: number;

	constructor() {
		this.id = "";
		this.Course = "";
		this.Title = "";
		this.Professor = "";
		this.Subject = "";
		this.year = 0;
		this.Avg = 0;
		this.Pass = 0;
		this.Fail = 0;
		this.Audit = 0;
	}
}
