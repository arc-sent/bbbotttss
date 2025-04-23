import type { Request, Response } from "express";
import { ReportedService } from "../services/reported.service";


export class ReportedController {
    private service;

    constructor(service: ReportedService) {
        this.service = service
    }

    async POST(req: Request, res: Response) {
        try {
            const body = req.body;
            const id = req.params.id;

            if (!body) {
                throw new Error('Ошибка в получении тела!')
            }

            const resService = await this.service.POST(id);

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

    async BANNED(req: Request, res: Response) {
        try {
            const id = req.params.id;

            if (!id) {
                throw new Error('Ошибка в получении айди юзера');
            }

            const body = req.body;

            if (!body) {
                throw new Error('Ошибка в получнии тела юзера');
            }

            const reqService = await this.service.BANNED(id, body);
            console.log(reqService);

            if (reqService.status === 400) {
                throw new Error(JSON.stringify(req.body.message))
            }

            res.status(200).json(reqService);
        } catch (err) {
            if (err instanceof Error) {
                res.status(400).json({ message: err.message })
            } else {
                res.status(400).json({ message: `Invalid err: ${err}` })
            }
        }
    }

    async LEAVE(req: Request, res: Response) {
        try {
            const id = req.params.id;
            const reqService = await this.service.LEAVE(id);

            if (reqService.status === 400) {
                throw new Error(JSON.stringify(req.body.message))
            }

            res.status(200).json(reqService);
        } catch (err) {
            if (err instanceof Error) {
                res.status(400).json({ message: err.message })
            } else {
                res.status(400).json({ message: `Invalid err: ${err}` })
            }
        }
    }

    async UNBANNED(req: Request, res: Response) {
        try {
            const id = req.params.id;
            const reqService = await this.service.UNBANNED(id);
            console.log(reqService);

            if (reqService.status === 400) {
                throw new Error(JSON.stringify(req.body.message))
            }

            res.status(200).json(reqService);
        } catch (err) {
            if (err instanceof Error) {
                res.status(400).json({ message: err.message })
            } else {
                res.status(400).json({ message: `Invalid err: ${err}` })
            }
        }
    }

    async GETREPORTED(req: Request, res: Response) {
        try {
            const reqService = await this.service.GETREPORTED();
            console.log(reqService);

            if (reqService.status === 400) {
                throw new Error(JSON.stringify(req.body.message))
            }

            res.status(200).json(reqService);
        } catch (err) {
            if (err instanceof Error) {
                res.status(400).json({ message: err.message })
            } else {
                res.status(400).json({ message: `Invalid err: ${err}` })
            }
        }
    }

    async ANNOUNCEMENT(req: Request, res: Response) {
        try {
            const body = req.body;

            if (!body) {
                throw new Error('Ошибка в получении тела!')
            }

            const resService = await this.service.ANNOUNCEMENT(body.message);

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

    async ADVERTISEMENT(req: Request, res: Response) {
        try {
            const body = req.body;

            if (!body) {
                throw new Error('Ошибка в получении тела!')
            }

            const resService = await this.service.ADVERTISEMENT(body);

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
}