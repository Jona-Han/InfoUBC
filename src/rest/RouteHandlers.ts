import {NextFunction, Request, Response} from "express";
import InsightFacade from "../controller/InsightFacade";
import {InsightDatasetKind, InsightError, NotFoundError} from "../controller/IInsightFacade";

export default class RouteHandlers {
	public static async putNewDataset(req: Request, res: Response) {
		try {
			const {id, kind} = req.params;
			const base64Data = req.body.toString("base64");

			const fc: InsightFacade = new InsightFacade();
			const results = await fc.addDataset(id, base64Data, kind as InsightDatasetKind);
			res.status(200).json({result: results});
		} catch (err: any) {
            if (err instanceof InsightError) {
                res.status(400).json({err: err.message});
            } else {
                res.status(500).json({err: err.message});
            }
		}
	}

	public static async getAllDatasetsHandler(req: Request, res: Response) {
		try {
			const fc: InsightFacade = new InsightFacade();
			const results = await fc.listDatasets();
			res.status(200).json({result: results});
		} catch (err: any) {
			res.status(500).json({err: err.message});
		}
	}

	public static async deleteDatasetHandler(req: Request, res: Response) {
		try {
			const fc: InsightFacade = new InsightFacade();
			const results = await fc.removeDataset(req.params.id);
			res.status(200).json({result: results});
		} catch (err: any) {
			if (err instanceof NotFoundError) {
                res.status(404).json({err: err.message});
            } else if (err instanceof InsightError) {
                res.status(400).json({err: err.message});
            } else {
                res.status(500).json({err: err.message});
            }
		}
	}

	public static async postQueryHandler(req: Request, res: Response) {
		try {
			const fc: InsightFacade = new InsightFacade();
			const results = await fc.performQuery(req.body);
			res.status(200).json({result: results});
		} catch (err: any) {
            if (err instanceof InsightError) {
                res.status(400).json({err: err.message});
            } else {
                res.status(500).json({err: err.message});
            }
		}
	}
}

