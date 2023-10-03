// A valid section containing all required keys of appropriate types
export default class Section {
	private id: string;
	private Course: string;
	private Title: string;
	private Professor: string;
	private Subject: string;
	private Year: number;
	private Avg: number;
	private Pass: number;
	private Fail: number;
	private Audit: number;

	constructor(section: any) {
		this.id = section["id"];
		this.Course = section["Course"];
		this.Title = section["Title"];
		this.Professor = section["Professor"];
		this.Subject = section["Subject"];
		this.Year = section["Year"];
		this.Avg = section["Avg"];
		this.Pass = section["Pass"];
		this.Fail = section["Fail"];
		this.Audit = section["Audit"];
	}
}
