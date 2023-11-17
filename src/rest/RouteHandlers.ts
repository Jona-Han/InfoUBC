import {Request, Response} from "express";
import InsightFacade from "../controller/InsightFacade";
import {InsightError, NotFoundError} from "../controller/IInsightFacade";

export default class RouteHandlers {
	public static async getAllDatasets(req: Request, res: Response) {
		try {
			const fc: InsightFacade = new InsightFacade();
			const results = await fc.listDatasets();
			res.status(200).json({result: results});
		} catch (err) {
			res.status(404).json({error: err});
		}
	}

	public static async deleteDataset(req: Request, res: Response) {
		try {
			const fc: InsightFacade = new InsightFacade();
			const results = await fc.removeDataset(req.params.id);
			res.status(200).json({result: results});
		} catch (err) {
			if (err instanceof NotFoundError) {
				res.status(404).json({error: err});
			} else {
				res.status(400).json({error: err});
			}
		}
	}
}
