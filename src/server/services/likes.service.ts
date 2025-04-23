import { PrismaClient } from "@prisma/client"
import axios from "axios";
import dotenv from 'dotenv';

dotenv.config();

export class LikeService {
    private prisma;

    constructor() {
        this.prisma = new PrismaClient();
    }

    async GET(id: string) {
        try {
            const findUser = await this.prisma.userBot.findFirst({
                where: { id: id }, include: {
                    pendingProfiles: true
                }
            });

            if (!findUser) {
                throw new Error('Ошибка в получении юзера');
            }

            const pending = findUser.pendingProfiles;
            const banned = findUser.banned;

            if (!pending) {
                throw new Error('Ошибка в получении массива с анкетами');
            }

            return { banned: banned, message: pending, status: 200 };
        } catch (err) {
            if (err instanceof Error) {
                return { message: err.message, status: 400 }
            }

            return { message: err, status: 400 }
        }

    }

    async PENDINGDELETE(penId: number) {
        try {
            const deletePending = await this.prisma.pandigProfile.delete({ where: { idPrisma: penId } });

            console.log(deletePending);

            if (!deletePending) {
                throw new Error('Error in delete profile in pending:' + deletePending);
            }

            return { message: deletePending, status: 200 }
        } catch (err) {
            if (err instanceof Error) {
                return { message: `Error: ${err.message}`, status: 400 }
            } else {
                return { message: `Invalid Error: ${err}`, status: 400 }
            }
        }
    }
}