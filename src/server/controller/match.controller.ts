import type { Request, Response } from "express";
import { MatchService } from "../services/match.service";

export class MatchController {
    private service;

    constructor(service: MatchService) {
        this.service = service
    }

    async GET(req: Request, res: Response) {
        try {
            const userId = req.params.id;

            const reqService = await this.service.GET(userId);

            if (reqService.status === 400) {
                console.log(reqService)
                throw new Error(`Ошибка в получении юзера: ${JSON.stringify(reqService.message)}`)
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

    async LIKE(req: Request, res: Response) {
        try {
            const id = req.params.id;
            const body = req.body;

            if (!/^\d+$/.test(id)) {
                throw new Error("Ваш айди должен быть числом")
            }

            const reqService = await this.service.LIKE(id, body)

            if (reqService.status === 400) {
                throw new Error(`Err: ${reqService.message}`);
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

    async DISLIKE(req: Request, res: Response) {
        try {
            const id = req.params.id;

            // if (!/^\d+$/.test(id)) {
            //     throw new Error("Ваш айди должен быть числом")
            // }

            const reqService = await this.service.DISLIKE(id)

            if (reqService.status === 400) {
                throw new Error(`Err: ${reqService.message}`);
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

    async BROADGEMS(req: Request, res: Response) {
        try {
            const fromId = req.params.fromId;

            if (!fromId) {
                throw new Error('Ошибка в айди отправляющего');
            }

            const toId = req.params.toId;

            if (!toId) {
                throw new Error('Ошибка в айди получающего');
            }

            const body = req.body;

            if (!("count" in body)) {
                throw new Error('Ошибка в получении count');
            }

            const reqService = await this.service.BROADGEMS(fromId, toId, body.count);

            if (reqService.status === 401) {
                return res.status(401).json(reqService);
            }

            if (reqService.status === 400) {
                throw new Error(`${JSON.stringify(reqService.message)}`)
            }

            res.status(200).json(reqService);
        } catch (err) {
            if (err instanceof Error) {
                res.status(400).json({ message: err.message });
            } else {
                console.error(err);
                res.status(400).json({ message: 'Invalid error, please check console' })
            }
        }
    }
}