import { ChanelsService } from "../services/chanels.service";
import type { Request, Response } from "express";

export class ChanelsController {
    private service;

    constructor(service: ChanelsService) {
        this.service = service
    }

    async GET(req: Request, res: Response) {
        try {
            const reqService = await this.service.GET();

            if (reqService.status === 400) {
                throw new Error(`Err: ${reqService.message}`);
            }

            res.status(200).json(reqService);
        } catch (err) {
            if (err instanceof Error) {
                return { message: `${err.message}`, status: 400 }
            } else {
                return { message: `${err}`, status: 400 }
            }
        }
    }

    async POST(req: Request, res: Response) {
        try {
            const body = req.body;

            if (!body) {
                throw new Error('Ошибка в получении тела')
            }

            const reqService = await this.service.POST(body.message);

            if (reqService.status === 400) {
                throw new Error(`Err: ${reqService.message}`);
            }

            res.status(200).json(reqService);
        } catch (err) {
            if (err instanceof Error) {
                return { message: `${err.message}`, status: 400 }
            } else {
                return { message: `${err}`, status: 400 }
            }
        }
    }

    async DELETE(req: Request, res: Response) {
        try {
            const body = req.params.body;

            if (!body) {
                throw new Error('Ошибка в получении тела');
            }

            const reqService = await this.service.DELETE(body);

            if (reqService.status === 400) {
                throw new Error(`Err: ${reqService.message}`);
            }

            res.status(200).json(reqService);
        } catch (err) {
            if (err instanceof Error) {
                return { message: `${err.message}`, status: 400 }
            } else {
                return { message: `${err}`, status: 400 }
            }
        }
    }
}