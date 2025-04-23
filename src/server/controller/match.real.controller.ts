import { MatchServiceReal } from "../services/match.real.service";
import type { Request, Response } from "express";
export class MatchReal {
    private service;

    constructor(service: MatchServiceReal) {
        this.service = service
    }

    async GET(req: Request, res: Response) {
        try {
            const id = req.params.id;

            const reqService = await this.service.GET(id);

            if (reqService.status === 400) {
                throw new Error(JSON.stringify(reqService.message));
            }

            res.status(200).json(reqService);
        } catch (err) {
            if (err instanceof Error) {
                res.status(400).json({ message: err.message });
            } else {
                console.error(err);
                res.status(400).json({ message: 'Invalid error, please chek console' })
            }
        }
    }

    async POST(req: Request, res: Response) {
        try {
            const id = req.params.id;
            const body = req.body;

            const reqService = await this.service.POST(id, body);

            if (reqService.status === 400) {
                throw new Error(JSON.stringify(reqService.message));
            }

            res.status(200).json(reqService);
        } catch (err) {
            if (err instanceof Error) {
                res.status(400).json({ message: err.message });
            } else {
                console.error(err);
                res.status(400).json({ message: 'Invalid error, please chek console' })
            }
        }
    }
}