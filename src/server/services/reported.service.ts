import { PrismaClient } from "@prisma/client";
import axios from 'axios';
import { redis } from "../server";

interface BodyAdvertisement {
    text: string,
    photo: string,
    link: string
}

interface BodyBanned {
    days: number
}

export class ReportedService {
    private prisma;
    private redis;

    constructor() {
        this.prisma = new PrismaClient();
        this.redis = redis
    }

    async POST(id: string) {
        try {

            const newReason = await this.prisma.userBot.update({
                where: { id: id },
                data: {
                    reported: {
                        increment: 1,
                    },
                },
            });

            if (!newReason) {
                throw new Error('Ошибка в создании репорта!');
            }

            return { message: 'Репорт успешно отправлен!', status: 200 }
        } catch (err) {
            if (err instanceof Error) {
                return { message: `Error: ${err.message}`, status: 400 }
            } else {
                return { message: `Invalid Error: ${err}`, status: 400 }
            }
        }
    }

    async BANNED(id: string, body: BodyBanned) {
        try {
            const expiryTime = new Date(new Date().getTime() + body.days * 24 * 60 * 60 * 1000);

            const updateUser = await this.prisma.userBot.update({
                where: { id: id }, data: {
                    banned: true,
                    bannedTime: expiryTime
                }
            });

            if (!updateUser) {
                throw new Error('Ошибка в бане юзера');
            }

            await axios.post(`https://api.telegram.org/bot${process.env.TELEG_TOKEN}/sendMessage`, {
                chat_id: id,
                text: `У вас бан! Больше вы не можете пользоваться ботом`,
                parse_mode: "HTML"
            });

            await redis.set(`ban-${id}`, "true")
            const getRedis = await redis.get(`ban-${id}`);
            console.log(getRedis);

            return { message: 'Юзер успешно забанен!', status: 200 }
        } catch (err) {
            if (err instanceof Error) {
                return { message: `Error: ${err.message}`, status: 400 }
            } else {
                return { message: `Invalid Error: ${err}`, status: 400 }
            }
        }
    }

    async LEAVE(id: string) {
        try {
            const updateUser = await this.prisma.userBot.update({
                where: { id: id }, data: {
                    reported: 0
                }
            });

            if (!updateUser) {
                throw new Error('Ошибка в обнулении репортов');
            }

            return { message: 'Юзеру успешно обнулили репорты!', status: 200 }
        } catch (err) {
            if (err instanceof Error) {
                return { message: `${err.message}`, status: 400 }
            } else {
                return { message: `${err}`, status: 400 }
            }
        }
    }

    async UNBANNED(id: string) {
        try {
            const updateUser = await this.prisma.userBot.update({
                where: { id: id }, data: {
                    banned: false,
                    reported: 0,
                    bannedTime: null
                }
            });

            if (!updateUser) {
                throw new Error('Ошибка в бане юзера');
            }

            await axios.post(`https://api.telegram.org/bot${process.env.TELEG_TOKEN}/sendMessage`, {
                chat_id: id,
                text: `Вы получили разбан!`,
                parse_mode: "HTML"
            });

            await redis.set(`ban-${id}`, "false")

            return { message: 'Юзер успешно разбанен!', status: 200 }
        } catch (err) {
            if (err instanceof Error) {
                return { message: `${err.message}`, status: 400 }
            } else {
                return { message: `${err}`, status: 400 }
            }
        }
    }

    async GETREPORTED() {
        try {
            const reportedUsers = await this.prisma.userBot.findMany({
                where: {
                    reported: {
                        gt: 2,
                    },
                },
                select: {
                    id: true,
                },
                take: 20,
            }).then(users => users.map(user => user.id));

            if (!reportedUsers) {
                throw new Error('Ошибка в получении репортов!');
            }

            if (reportedUsers.length === 0) {
                return { message: "Пока нет репортов!", status: 200 }
            }

            return { message: reportedUsers, status: 200 }
        } catch (err) {
            if (err instanceof Error) {
                return { message: `${err.message}`, status: 400 }
            } else {
                return { message: `${err}`, status: 400 }
            }
        }
    }

    async ANNOUNCEMENT(text: string) {
        try {
            const users = await this.prisma.userBot.findMany({
                select: { id: true }
            }).then(users => users.map(user => user.id));

            const filteredUsers = users.filter(id => !id.startsWith('user'));

            filteredUsers.forEach(async (id) => {
                await axios.post(`https://api.telegram.org/bot${process.env.TELEG_TOKEN}/sendMessage`, {
                    chat_id: id,
                    text: text,
                    parse_mode: "HTML"
                });
            })

            console.log(filteredUsers);

            console.log('filteredUsers', filteredUsers);

            return { message: '123123', status: 200 }
        } catch (err) {
            if (err instanceof Error) {
                return { message: `Error: ${err.message}`, status: 400 }
            } else {
                return { message: `Invalid Error: ${err}`, status: 400 }
            }
        }
    }

    async ADVERTISEMENT(body: BodyAdvertisement) {
        try {
            const NewAdvertisement = await this.prisma.advertisement.create({
                data: {
                    text: body.text,
                    photo: body.photo,
                    link: body.link
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
}