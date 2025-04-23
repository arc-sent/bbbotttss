import type { Request, Response } from "express";
import { AdvertisementService } from "../services/advertisement.service";

interface BodyAdvertisement {
    text: string,
    photo: string,
    link: string
}

export class AdvertisementController {
    private service;

    constructor(service: AdvertisementService) {
        this.service = service
    }

    async POST(req: Request, res: Response) {
        try {
            const body = req.body;

            if (!body) {
                throw new Error('Ошибка в получении тела!')
            }

            const resService = await this.service.POST(body);

            if (resService.status === 400) {
                throw new Error(JSON.stringify(resService.message));
            }

            res.status(200).json(resService);
        } catch (err) {
            if (err instanceof Error) {
                res.status(400).json({ message: err.message })
            } else {
                res.status(400).json({ message: `Invalid err: ${err}` })
            }
        }
    }

    async GET(req: Request, res: Response) {
        try {
            const id = req.params.id;
            let resService;

            if (id) {
                resService = await this.service.GET(id);
            } else {
                resService = await this.service.GET()
            }

            if (resService.status === 400) {
                throw new Error(JSON.stringify(resService.message))
            }

            res.status(200).json(resService);
        } catch (err) {
            if (err instanceof Error) {
                res.status(400).json({ message: err.message })
            } else {
                res.status(400).json({ message: `Invalid err: ${err}` })
            }
        }
    }

    async DELETE(req: Request, res: Response) {
        try {
            const id = req.params.id;

            if (!id) {
                throw new Error('Ошибка в получении айди');
            }

            const resService = await this.service.DELETE(id);

            if (resService.status === 400) {
                throw new Error(JSON.stringify(resService.message))
            }

            res.status(200).json(resService);
        } catch (err) {
            if (err instanceof Error) {
                res.status(400).json({ message: err.message })
            } else {
                res.status(400).json({ message: `Invalid err: ${err}` })
            }
        }
    }
}