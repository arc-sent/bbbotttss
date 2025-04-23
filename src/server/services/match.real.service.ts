import { PrismaClient } from "@prisma/client";
import { BodyLike } from "../interfaces/metch.interface";

export class MatchServiceReal {
    private prisma;
    constructor() {
        this.prisma = new PrismaClient()
    }

    async GET(id: string) {
        try {
            const findUser = await this.prisma.userBot.findFirst({
                where: { id: id }, include: {
                    metching: true
                }
            });

            if (!findUser) {
                throw new Error('Ошибка в получении юзера!');
            }

            const match = findUser.metching;
            const banned = findUser.banned;

            if (!match) {
                throw new Error('Ошибка в получении метчей!');
            }

            return { banned: banned, message: match, status: 200 }
        } catch (err) {
            if (err instanceof Error) {
                return { message: err.message, status: 400 }
            }

            return { message: err, status: 400 }
        }
    }

    async POST(id: string, body: BodyLike) {
        try {
            const recordCount = await this.prisma.metchProfile.count({
                where: { userId: id },
            });

            if (recordCount >= 3) {
                const oldestRecord = await this.prisma.metchProfile.findFirst({
                    where: { userId: id },
                    orderBy: { createdAt: 'asc' }
                })

                if (oldestRecord) {
                    await this.prisma.metchProfile.delete({
                        where: { idPrisma: oldestRecord.idPrisma }
                    })
                }
            }

            const newRecordForstUser = await this.prisma.metchProfile.create({
                data: {
                    message: body.message,
                    fromId: body.fromId,
                    userId: id
                }
            });

            if (!newRecordForstUser) {
                throw new Error(`Ошибка в создании юзера ${JSON.stringify(newRecordForstUser)}`);
            }

            const newRecordSecondUser = await this.prisma.metchProfile.create({
                data: {
                    message: body.message,
                    fromId: id,
                    userId: body.fromId
                }
            });

            if (!newRecordSecondUser) {
                throw new Error(`Ошибка в создании юзера ${JSON.stringify(newRecordSecondUser)}`);
            }


            return { message: 'Успешное создание метча!', status: 200 }
        } catch (err) {
            if (err instanceof Error) {
                return { message: err.message, status: 400 }
            }

            return { message: err, status: 400 }
        }
    }
}