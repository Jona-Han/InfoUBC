import {Request, Response} from "express";
import InsightFacade from "../controller/InsightFacade";
import {InsightDatasetKind, NotFoundError} from "../controller/IInsightFacade";

export default class RouteHandlers {
	public static async putNewDataset(req: Request, res: Response) {
		try {
			const {id, kind} = req.params;
			const base64Data = req.body.toString("base64");

			const fc: InsightFacade = new InsightFacade();
			const results = await fc.addDataset(id, base64Data, kind as InsightDatasetKind);
			res.status(200).json({result: results});
		} catch (err: any) {
			res.status(404).json({error: err["message"]});
		}
	}

	public static async getAllDatasetsHandler(req: Request, res: Response) {
		try {
			const fc: InsightFacade = new InsightFacade();
			const results = await fc.listDatasets();
			res.status(200).json({result: results});
		} catch (err) {
			res.status(404).json({error: err});
		}
	}

	public static async deleteDatasetHandler(req: Request, res: Response) {
		try {
			const fc: InsightFacade = new InsightFacade();
			const results = await fc.removeDataset(req.params.id);
			res.status(200).json({result: results});
		} catch (err: any) {
			if (err instanceof NotFoundError) {
				res.status(404).json({error: err["message"]});
			} else {
				res.status(400).json({error: err["message"]});
			}
		}
	}

	public static async postQueryHandler(req: Request, res: Response) {
		try {
			const fc: InsightFacade = new InsightFacade();
			console.log(req.body);
			const results = await fc.performQuery(req.body);
			res.status(200).json({result: results});
		} catch (err: any) {
			res.status(400).json({error: err["message"]});
		}
	}
}
