import { PrismaClient } from "@prisma/client";

interface BodyAdvertisement {
    text: string,
    photo: string,
    link: string,
    day: number
}

export class AdvertisementService {
    private prisma;

    constructor() {
        this.prisma = new PrismaClient();
    }

    async POST(body: BodyAdvertisement) {
        try {
            const currentTime = new Date();
            const expiryTime = new Date(currentTime.getTime() + body.day * 24 * 60 * 60 * 1000);

            console.log('currentDate', expiryTime);

            const NewAdvertisement = await this.prisma.advertisement.create({
                data: {
                    text: body.text,
                    photo: body.photo,
                    link: body.link,
                    due: expiryTime
                }
            });

            if (!NewAdvertisement) {
                throw new Error('Ошибка в создании канала для рекламы')
            }

            return { message: NewAdvertisement, status: 200 }
        } catch (err) {
            if (err instanceof Error) {
                return { message: `Error: ${err.message}`, status: 400 }
            } else {
                return { message: `Invalid Error: ${err}`, status: 400 }
            }
        }
    }

    async GET(id?: string) {
        try {
            let findAdvertisement;
            if (id) {
                findAdvertisement = await this.prisma.advertisement.findFirst({ where: { id: Number(id) } });
            } else {
                findAdvertisement = await this.prisma.advertisement.findMany();
            }

            console.log("findAdvertisement", !findAdvertisement)

            if (!findAdvertisement) {
                throw new Error('Ошибка в получении списка каналов/отдельного канала')
            }

            return { message: findAdvertisement, status: 200 }
        } catch (err) {
            if (err instanceof Error) {
                return { message: `Error: ${err.message}`, status: 400 }
            } else {
                return { message: `Invalid Error: ${err}`, status: 400 }
            }
        }
    }

    async DELETE(id: string) {
        try {
            const findDelete = await this.prisma.advertisement.findFirst({ where: { id: Number(id) } });

            if (!findDelete) {
                throw new Error('Такого канала нет в бд!');
            }

            const deleteAdverstisement = await this.prisma.advertisement.delete({ where: { id: Number(id) } });

            if (!deleteAdverstisement) {
                throw new Error('Ошибка при удалении канала');
            }

            return { message: deleteAdverstisement, status: 200 }
        } catch (err) {
            if (err instanceof Error) {
                return { message: `Error: ${err.message}`, status: 400 }
            } else {
                return { message: `Invalid Error: ${err}`, status: 400 }
            }
        }
    }
}