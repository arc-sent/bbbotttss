import { PaymentsService } from "../services/payments.service";
import { Request, Response } from "express";


export class PaymentsController {
    private service
    constructor(service: PaymentsService) {
        this.service = service
    }

    async POST(req: Request, res: Response) {
        try {
            const body = req.body;
            const id = req.params.id;

            if (!id) {
                throw new Error('Ошибка в получении айди')
            }

            const reqService = await this.service.POST(id, body);

            if (reqService.status === 400) {
                throw new Error(JSON.stringify(reqService.message));
            }

            res.status(200).json(reqService)
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
            const id = req.params.payId;

            if (!id) {
                throw new Error('Ошибка в получении айди');
            }

            if (!/^\d+$/.test(id)) {
                throw new Error("Ваш айди должен быть числом")
            }

            const reqService = await this.service.GET(Number(id));

            if (reqService.status === 400) {
                throw new Error(JSON.stringify(reqService.message));
            }

            res.status(200).json(reqService)
        } catch (err) {
            if (err instanceof Error) {
                res.status(400).json({ message: err.message })
            } else {
                res.status(400).json({ message: `Invalid err: ${err}` })
            }
        }
    }

    async PUT(req: Request, res: Response) {
        try {
            const body = req.body;
            const id = req.params.payId;

            if (!id) {
                throw new Error('Ошибка в получении айди');
            }

            if (!/^\d+$/.test(id)) {
                throw new Error("Ваш айди должен быть числом")
            }
            const reqService = await this.service.PUT(Number(id), body);

            if (reqService.status === 400) {
                throw new Error(JSON.stringify(reqService.message));
            }

            res.status(200).json(reqService)
        } catch (err) {
            if (err instanceof Error) {
                res.status(400).json({ message: err.message })
            } else {
                res.status(400).json({ message: `Invalid err: ${err}` })
            }
        }
    }
}