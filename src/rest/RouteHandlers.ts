import {NextFunction, Request, Response} from "express";
import InsightFacade from "../controller/InsightFacade";
import {InsightDatasetKind, NotFoundError} from "../controller/IInsightFacade";

export default class RouteHandlers {
	public static async putNewDataset(req: Request, res: Response, next: NextFunction) {
		try {
			const {id, kind} = req.params;
			const base64Data = req.body.toString("base64");

			const fc: InsightFacade = new InsightFacade();
			const results = await fc.addDataset(id, base64Data, kind as InsightDatasetKind);
			res.status(200).json({result: results});
		} catch (err: any) {
			next(err);
		}
	}

	public static async getAllDatasetsHandler(req: Request, res: Response, next: NextFunction) {
		try {
			const fc: InsightFacade = new InsightFacade();
			const results = await fc.listDatasets();
			res.status(200).json({result: results});
		} catch (err) {
			next(err);
		}
	}

	public static async deleteDatasetHandler(req: Request, res: Response, next: NextFunction) {
		try {
			const fc: InsightFacade = new InsightFacade();
			const results = await fc.removeDataset(req.params.id);
			res.status(200).json({result: results});
		} catch (err: any) {
			next(err);
		}
	}

	public static async postQueryHandler(req: Request, res: Response, next: NextFunction) {
		try {
			const fc: InsightFacade = new InsightFacade();
			const results = await fc.performQuery(req.body);
			res.status(200).json({result: results});
		} catch (err: any) {
			next(err);
		}
	}
}

