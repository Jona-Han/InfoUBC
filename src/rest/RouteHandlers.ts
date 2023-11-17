import { Request, Response } from "express";
import InsightFacade from "../controller/InsightFacade";

export default class RouteHandlers {
    public static async getAllDatasets(req: Request, res: Response) {
		try {
            const fc: InsightFacade = new InsightFacade();
            const results = await fc.listDatasets();
            res.status(200).json({result: results});
		} catch (err) {
			res.status(400).json({error: err});
		}
	}

}
