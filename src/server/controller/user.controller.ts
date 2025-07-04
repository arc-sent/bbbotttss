import type { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { UserValidatePOST, UserValidatePUT } from "../library/user.zod";
import axios from "axios";

export class UserController {
    private service;

    constructor(service: UserService) {
        this.service = service
    }

    async GET(req: Request, res: Response) {
        try {
            const id = req.params.id;

            if (!id) {
                throw new Error('Ошибка в получении юзера');
            }

            const reqServices = await this.service.GET(id);

            if (reqServices.status === 400) {
                throw new Error(`${reqServices.message}`);
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

    async PUT(req: Request, res: Response) {
        try {
            const id = req.params.id;
            const body = req.body;

            if (!body) {
                throw new Error('Ошибка в получении тела ' + req.body);
            }
            const schema = UserValidatePUT.safeParse({
                name: body.name,
                description: body.description,
                photo: body.photo,
                city: body.city,
                age: body.age
            });

            if (!schema.success) {
                let textErr = '';
                schema.error.errors.forEach((e) => {
                    textErr += `${e.path}: ${e.message}, `
                });

                throw new Error(textErr);
            }

            const reqServices = await this.service.PUT(body, id);

            console.log(reqServices);

            if (reqServices.status === 400) {
                throw new Error(`${reqServices.message}`);
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

    async DELETE(req: Request, res: Response) {
        try {
            const id = req.params.id;

            if (!id) {
                throw new Error("Ошибка в получении id");
            }

            const reqServices = await this.service.DELETE(id);

            if (reqServices.status === 400) {
                throw new Error(`${reqServices.message}`);
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

    async POST(req: Request, res: Response) {
        console.log(req.body);

        try {
            const body = req.body;

            if (!body) {
                throw new Error('Ошибка в получении тела ' + req.body);
            }


            const schema = UserValidatePOST.safeParse({
                name: body.name,
                description: body.description,
                id: body.id,
                photo: body.photo,
            });


            if (!schema.success) {
                let textErr = '';
                schema.error.errors.forEach((e) => {
                    textErr += `${e.path}: ${e.message}, `
                });

                throw new Error(textErr);
            }

            const obj = {
                name: body.name,
                description: body.description,
                id: body.id,
                photo: body.photo,
                age: body.age,
                minAge: body.age,
                maxAge: body.age + 2,
                city: "Москва",
                lat: 55.7558,
                lon: 37.6176,
                gender: body.gender
            }

            try {
                const urlOpenStreet = `https://nominatim.openstreetmap.org/search?q=${body.city}&format=json&limit=1`;
                const reqOpenStreetMap = await axios.get(urlOpenStreet);

                if (reqOpenStreetMap.status === 400) {
                    throw new Error(JSON.stringify(reqOpenStreetMap.data));
                }

                const data = reqOpenStreetMap.data[0];

                obj.city = body.city;
                obj.lat = data.lat;
                obj.lon = data.lon;

            } catch (err) {
                console.log(err);
            }


            const reqServices = await this.service.POST(obj);

            console.log(reqServices);

            if (reqServices.status === 400) {
                throw new Error(`${reqServices.message}`);
            }

            if ('find' in reqServices) {
                res.status(200).json({ message: reqServices.message, find: reqServices.find })
            } else {
                res.status(200).json({ message: reqServices.message })
            }
        } catch (err) {
            if (err instanceof Error) {
                res.status(400).json({ message: err.message })
            } else {
                res.status(400).json({ message: `Invalid err: ${err}` })
            }
        }
    }

    async PATH(req: Request, res: Response) {
        try {
            const id = req.params.id;
            const body = req.body;

            if (!body) {
                throw new Error('Ошибка в получении тела ' + req.body);
            }

            const reqServices = await this.service.PATH(body, id);

            console.log(reqServices);

            if (reqServices.status === 400) {
                throw new Error(`${reqServices.message}`);
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

    async PREMIUM(req: Request, res: Response) {
        try {
            const id = req.params.id;
            const body = req.body;

            if (!id) {
                throw new Error('Ошибка в получении айди ' + req.body);
            }

            if (!body) {
                throw new Error('Ошибка в получении тела ' + req.body);
            }

            const reqServices = await this.service.PREMIUM(body, id);

            console.log(reqServices);

            if (reqServices.status === 400) {
                throw new Error(`${reqServices.message}`);
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

    async STATISTICS(req: Request, res: Response) {
        try {
            const id = req.params.id;
            const body = req.body;

            if (!body) {
                throw new Error('Ошибка в получении тела ' + req.body);
            }

            const reqServices = await this.service.STATISTICS(id, body);

            console.log(reqServices);

            if (reqServices.status === 400) {
                throw new Error(`${reqServices.message}`);
            }
            res.status(200).json({ message: reqServices.message });
        } catch (err) {
            if (err instanceof Error) {
                res.status(400).json({ message: err.message })
            } else {
                res.status(400).json({ message: `Invalid err: ${err}` })
            }
        }
    }

    async GEMS(req: Request, res: Response) {
        try {
            const id = req.params.id;
            const body = req.body;

            if (!body) {
                throw new Error('Ошибка в получении тела ' + req.body);
            }

            const reqServices = await this.service.GEMS(id, body);

            console.log(reqServices);

            if (reqServices.status === 400) {
                throw new Error(`${reqServices.message}`);
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

    async CASE(req: Request, res: Response) {
        try {
            const id = req.params.id;
            const body = req.body;

            if (!id || !body.caseType || !["increment", "decrement"].includes(body.action)) {
                throw new Error("Неверные данные");
            }

            const reqServices = await this.service.CASE(id, body);

            console.log(reqServices);

            if (reqServices.status === 400) {
                throw new Error(`${reqServices.message}`);
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

    async REFERRAL(req: Request, res: Response) {
        try {
            const invitedId = req.params.invitedId;

            if (!invitedId) {
                throw new Error('Ошибка в получении айди получающего');
            }

            const invitingId = req.params.invitingId;

            if (!invitingId) {
                throw new Error('Ошибка в получении айди получающего');
            }

            const reqServices = await this.service.REFERRAL(invitingId, invitedId);

            if (reqServices.status === 400) {
                throw new Error(`${reqServices.message}`);
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

    async SHUTDOWN(req: Request, res: Response) {
        try {
            const id = req.params.id;
            const body = req.body

            if (!id) {
                throw new Error('Ошибка в получении юзера');
            }

            if (!('status' in body)) {
                throw new Error('Ошибка в получении статуса отключении');
            }

            const reqServices = await this.service.SHUTDOWN(id, body.status);

            if (reqServices.status === 400) {
                throw new Error(`${reqServices.message}`);
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

    async VIEWED(req: Request, res: Response) {
        try {
            const id = req.params.id;
            const body = req.body;

            if (!body) {
                throw new Error('Ошибка в получении тела ' + req.body);
            }

            const reqServices = await this.service.VIEWED(id, body.viewed); //

            if (reqServices.status === 400) {
                throw new Error(`${reqServices.message}`);
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

    async TOP(req: Request, res: Response) {
        try {
            const top = req.params.topNum;

            if (!top) {
                throw new Error('Ошибка в получении юзера');
            }

            if (!/^\d+$/.test(top)) {
                throw new Error("Ваш top должен быть числом")
            }

            const reqServices = await this.service.TOP(Number(top));

            if (reqServices.status === 400) {
                throw new Error(`${reqServices.message}`);
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

    async GENDER(req: Request, res: Response) {
        try {
            const id = req.params.id;
            const body = req.body;

            if (!('gender' in body)) {
                throw new Error('Ошибка в получении тела');
            }

            const reqServices = await this.service.GENDER(id, body.gender);

            if (reqServices.status === 400) {
                throw new Error(`${reqServices.message}`);
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

    async EDITGENDER(req: Request, res: Response) {
        try {
            const id = req.params.id;
            const body = req.body;

            if (!('gender' in body)) {
                throw new Error('Ошибка в получении тела');
            }

            const reqServices = await this.service.EDITGENDER(id, body.gender);

            if (reqServices.status === 400) {
                throw new Error(`${reqServices.message}`);
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

    async MANYGET(req: Request, res: Response) {
        try {
            const reqServices = await this.service.MANYGET();

            if (reqServices.status === 400) {
                throw new Error(`${reqServices.message}`);
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

    async GETPHOTO(req: Request, res: Response) {
        try {
            const id = req.params.id;

            if (!id) {
                throw new Error("Ошибка в получении айди юзера");
            }

            const resTg = await axios.get(
                `https://api.telegram.org/bot${process.env.TELEG_TOKEN}/getUserProfilePhotos`,
                {
                    params: {
                        user_id: id,
                        limit: 1
                    },
                    validateStatus: () => true
                }
            );

            if (!resTg.data.ok) {
                throw new Error(`Telegram API error: ${resTg.data.description}`);
            }

            const photos = resTg.data.result.photos;
            const fileId = photos[0][0].file_id

            const resUrl = await axios.get(
                `https://api.telegram.org/bot${process.env.TELEG_TOKEN}/getFile?file_id=${fileId}`,
                { validateStatus: () => true }
            );

            if (!resUrl.data.ok) {
                throw new Error(`Ошибка Telegram API: ${resUrl.data.description}`);
            }

            console.log("resUrl", resUrl.data)
            const filePath = resUrl.data.result.file_path;

            res.status(200).json({ message: filePath });
        } catch (err) {
            if (err instanceof Error) {
                res.status(400).json({ message: err.message })
            } else {
                res.status(400).json({ message: `Invalid err: ${err}` })
            }
        }
    }
}