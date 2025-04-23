import type { Request, Response } from "express";
import { LikeService } from "../services/likes.service";

export class LikesController {
    private service;

    constructor(services: LikeService) {
        this.service = services
    }

    async GET(req: Request, res: Response) {
        try {
            const id = req.params.id;

            if (!/^\d+$/.test(id)) {
                throw new Error("Ваш айди должен быть числом")
            }
            
            const reqService = await this.service.GET(id);

            if (reqService.status === 400) {
                throw new Error(`Ошибка в получении юзера: ${JSON.stringify(req.body.message)}`)
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

    async PENDINGDELETE(req: Request, res: Response) {
        try {
            const penId = req.params.penId;

            if(!penId){
                throw new Error('Ошибка в получении айди для удаления юзера ил массива одижания');
            }

            const reqServices = await this.service.PENDINGDELETE(Number(penId));

            if (reqServices.status === 400) {
                throw new Error(`Err: ${reqServices.message}`);
            }

            res.status(200).json({ message: reqServices.message })
        } catch (err) {
            if (err instanceof Error) {
                res.status(400).json({ message: err.message })
            } else {
                res.status(400).json({ message: `Invalid err: ${err}` })
            }
        }
    }
}