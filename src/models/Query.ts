import {InsightError, InsightResult} from "../controller/IInsightFacade";
import {Filter, IQuery, JSONQuery, LogicComparison, MComparison, Negation, Options, SComparison} from "./IQuery";
import * as fs from "fs-extra";
import QueryValidator from "../utils/QueryValidator";
import Dataset from "./Dataset";
import { Section } from "./Dataset";

export class Query implements IQuery {
	public WHERE: Filter;
	public OPTIONS: Options;
	public datasetName: string;

    private directory = "./data";
    private data: Dataset;

	constructor(queryJSON: JSONQuery) {
		let QV: QueryValidator = new QueryValidator();
		this.datasetName = QV.validateQuery(queryJSON);
		this.WHERE = queryJSON.WHERE;
		this.OPTIONS = queryJSON.OPTIONS;
        this.data = new Dataset(this.datasetName);
	}

	public execute(): InsightResult[] {
        if (!fs.pathExistsSync(this.directory + "/" + this.datasetName + ".json")) {
            throw new InsightError(`Cannot query from ${this.datasetName} due to not being added yet.`)
        }
        this.loadData();
        const afterWhere = this.handleWhere();
		return this.handleOptions(afterWhere);
	}

    private loadData() {
        const object = fs.readJSONSync(this.directory + "/" + this.datasetName + ".json");
        this.data.addSections(object.sections);
    }

    private handleWhere(): InsightResult[] {
        if (!this.WHERE) {
            throw new InsightError("this.WHERE should not be NULL after query validated")
        } else if ('AND' in this.WHERE || 'OR' in this.WHERE) {
            return this.handleLogicComparison(this.WHERE as LogicComparison);
        } else if ('LT' in this.WHERE || 'GT' in this.WHERE || 'EQ' in this.WHERE) {
            return this.handleMComparison(this.WHERE as MComparison);
        } else if ('IS' in this.WHERE) {
            this.handleSComparison(this.WHERE as SComparison);
            return [];
        } else if ('NOT' in this.WHERE) {
            return this.handleNegation(this.WHERE as Negation);
        } else {
            throw new Error("Invalid filter type");
        }
    }

    private handleNegation(input: Negation): InsightResult[] {
        throw new Error("Method not implemented.");
    }

    public handleSComparison(input: SComparison): Map<string, number> {
        const sectionMappings = new Map<string, number>();

        this.data.getSections().forEach((section: any) => {
            const key = Object.keys(input.IS)[0];
		    const sField = key.split("_")[1];
            const sValue = input.IS[key];

            if (section[sField] === sValue) {
                sectionMappings.set(section.uuid, section);
            }
        })
        return sectionMappings;
    }

    private handleMComparison(input: MComparison): InsightResult[] {
        throw new Error("Method not implemented. GT/LT/EQ");
    }

    private handleLogicComparison(input: LogicComparison): InsightResult[] {
        throw new Error("Method not implemented.");
    }    

    private handleOptions(input: InsightResult[]): InsightResult[] {
        throw new Error("Method not implemented");
    }
}
