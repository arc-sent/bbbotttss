import { PrismaClient } from "@prisma/client";

export class ChanelsService {
    private prisma;

    constructor() {
        this.prisma = new PrismaClient()
    }

    async GET() {
        try {
            const findManyChanels = await this.prisma.chanels.findMany();

            if (!findManyChanels) {
                throw new Error('Ошибка в получении каналов!');
            }

            return { message: findManyChanels, status: 200 }
        } catch (err) {
            if (err instanceof Error) {
                return { message: `${err.message}`, status: 400 }
            } else {
                return { message: `${err}`, status: 400 }
            }
        }
    }

    async POST(body: string) {
        try {
            const newChanels = await this.prisma.chanels.create({
                data: {
                    nickname: body
                }
            });

            if (!newChanels) {
                throw new Error('Ошибка в создании нового канала')
            }

            return { message: 'Успешное создание нового канала', status: 200 }
        } catch (err) {
            if (err instanceof Error) {
                return { message: `${err.message}`, status: 400 }
            } else {
                return { message: `${err}`, status: 400 }
            }
        }
    }

    async DELETE(body: string) {
        try {
            const findDeleteChanels = await this.prisma.chanels.findFirst({ where: { nickname: body } });

            if (!findDeleteChanels) {
                return { message: 'Такого канала нет в бд!', status: 200 }
            }

            const deleteChanels = await this.prisma.chanels.delete({ where: { nickname: body } });

            if (!deleteChanels) {
                throw new Error('Ошибка в удалении канала!')
            }

            return { message: 'Успешное удаление канала из бд', status: 200 }
        } catch (err) {
            if (err instanceof Error) {
                return { message: `${err.message}`, status: 400 }
            } else {
                return { message: `${err}`, status: 400 }
            }
        }
    }
}