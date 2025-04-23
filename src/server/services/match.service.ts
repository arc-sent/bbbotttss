import { PrismaClient } from "@prisma/client"
import { Prisma } from "@prisma/client";
import axios from "axios";
import dotenv from 'dotenv';
import { BodyLike } from "../interfaces/metch.interface";
import { MatchServiceReal } from "./match.real.service";
import { redis } from "../server";
dotenv.config();

type ProfileIdsResult = { idprofiles: string[] | null }[];

export class MatchService {
    private prisma;

    constructor() {
        this.prisma = new PrismaClient()
    }

    async GET(id: string) {
        try {

            const viewedIdsRedis = await redis.lrange(`viewed-${id}`, 0, -1);

            const parsedIds = viewedIdsRedis.map(item => JSON.parse(item));
            console.log(parsedIds);

            const parseViewed = parsedIds.filter(item => {
                if (item.premium && item.count < 5) {
                    return
                }

                return item
            })

            console.log("parseViewed", parseViewed);

            const findUser = await this.prisma.userBot.findFirst({ where: { id: id } });

            if (!findUser) {
                throw new Error('Ошибка в получении юзера')
            }

            const lon = findUser.long;
            const lat = findUser.lat;

            const minAge = findUser.minAge;
            const maxAge = findUser.maxAge;


            const searchGender = findUser.searchGender;

            console.log(findUser);

            const viewedIdsId = parseViewed.map(item => {
                return item.id
            });

            const findViewedProfile = await this.prisma.viewedProfile.findMany({
                where: { userId: id }
            });

            const findviewedIdsId = findViewedProfile.map(item => {
                return item.viewedId
            })

            console.log('findViewedProfile', findviewedIdsId);

            const viewedIds = `{${[...viewedIdsId, ...findviewedIdsId, id].map((v) => `"${v}"`).join(",")}}`;

            console.log("viewedIds:", viewedIds);

            //             const profiles: ProfileIdsResult = await this.prisma.$queryRaw`
            // SELECT ARRAY_AGG(subquery.id) AS idProfiles
            // FROM (
            //     (
            //       SELECT id, 
            //              ST_Distance(location, ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)) AS distance
            //       FROM "UserBot"
            //       WHERE 
            //           ST_DWithin(location, ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326), 50000)
            //           AND age BETWEEN ${minAge} AND ${maxAge}
            //           AND gender = ${searchGender}
            //           AND id != ALL (${viewedIds}::text[])
            //           AND shutdown = false
            //     )
            //     UNION ALL
            //     (
            //       SELECT id, 
            //              ST_Distance(location, ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)) AS distance
            //       FROM "UserBot"
            //       WHERE 
            //           ST_DWithin(location, ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326), 100000)
            //           AND age BETWEEN ${minAge} AND ${maxAge}
            //           AND gender = ${searchGender}
            //           AND id != ALL (${viewedIds}::text[]) 
            //           AND shutdown = false
            //           AND id NOT IN (
            //               SELECT id FROM "UserBot"
            //               WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326), 50000) 
            //           )
            //     )
            //     UNION ALL
            //     (
            //       SELECT id, 
            //              ST_Distance(location, ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)) AS distance
            //       FROM "UserBot"
            //       WHERE 
            //           ST_DWithin(location, ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326), 200000)
            //           AND age BETWEEN ${minAge} AND ${maxAge}
            //           AND gender = ${searchGender}
            //           AND id != ALL (${viewedIds}::text[]) 
            //           AND shutdown = false
            //           AND id NOT IN (
            //               SELECT id FROM "UserBot"
            //               WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326), 100000) 
            //           )
            //     )
            //     ORDER BY distance
            //     LIMIT 20
            // ) AS subquery;
            // `;


            const userGender = findUser.gender;

            const profiles: ProfileIdsResult = await this.prisma.$queryRaw`
SELECT ARRAY_AGG(subquery.id) AS idProfiles
FROM (
    (
      SELECT id, 
             ST_Distance(location, ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)) AS distance
      FROM "UserBot"
      WHERE 
          ST_DWithin(location, ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326), 50000)
          AND age BETWEEN ${minAge} AND ${maxAge}
          AND gender = ${searchGender}
          AND "searchGender" = ${userGender}
          AND id != ALL (${viewedIds}::text[])
          AND shutdown = false
    )
    UNION ALL
    (
      SELECT id, 
             ST_Distance(location, ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)) AS distance
      FROM "UserBot"
      WHERE 
          ST_DWithin(location, ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326), 100000)
          AND age BETWEEN ${minAge} AND ${maxAge}
          AND gender = ${searchGender}
          AND "searchGender" = ${userGender}
          AND id != ALL (${viewedIds}::text[])
          AND shutdown = false
          AND id NOT IN (
              SELECT id FROM "UserBot"
              WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326), 50000) 
          )
    )
    UNION ALL
    (
      SELECT id, 
             ST_Distance(location, ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)) AS distance
      FROM "UserBot"
      WHERE 
          ST_DWithin(location, ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326), 200000)
          AND age BETWEEN ${minAge} AND ${maxAge}
          AND gender = ${searchGender}
          AND "searchGender" = ${userGender}
          AND id != ALL (${viewedIds}::text[])
          AND shutdown = false
          AND id NOT IN (
              SELECT id FROM "UserBot"
              WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326), 100000) 
          )
    )
    ORDER BY distance
    LIMIT 20
) AS subquery;
`;

            console.log("profiles")
            console.log(profiles);
            console.log("profiles[0].idprofiles == null", profiles[0].idprofiles == null)
            if (profiles[0].idprofiles == null) {
                return { message: 'Нет подходящих анкет', status: 201 };
            }

            return { message: profiles[0].idprofiles, status: 200 }
        } catch (err) {
            if (err instanceof Error) {
                return { message: err.message, status: 400 }
            }

            return { message: err, status: 400 }
        }

    }

    async LIKE(id: string, body: BodyLike) {
        try {
            const updateUser = await this.prisma.userBot.update({
                where: { id: id },
                data: {
                    like: {
                        increment: 1
                    }
                }
            });

            if (!updateUser) {
                throw new Error(`Ошибка в обновлении юзера: ${JSON.stringify(updateUser)}`);
            }

            const findLiker = await this.prisma.userBot.findUnique({ where: { id: body.fromId } });

            if (!findLiker) {
                throw new Error(`Ошибка в отправке лайка: ${JSON.stringify(findLiker)}`);
            }

            if (body.metch) {
                const serviceMatch = new MatchServiceReal();

                const reqServiceMatch = await serviceMatch.POST(id, body);

                if (reqServiceMatch.status === 400) {
                    throw new Error(`Ошибка в создании метча ${JSON.stringify(reqServiceMatch.message)}`);
                }

                console.log(reqServiceMatch.message);

                await axios.post(`https://api.telegram.org/bot${process.env.TELEG_TOKEN}/sendMessage`, {
                    chat_id: id,
                    text: `<b>🎉 У вас новый метч!</b>\n\nПерейдите в меню <b>"💞 Метчи"</b>, чтобы узнать, кто тоже вас лайкнул! Начните общение прямо сейчас!`,
                    parse_mode: "HTML"
                });

                return { message: 'Пользователь обновлен', status: 200, premium: updateUser.premium }
            } else {
                const findPendingProfiel = await this.prisma.pandigProfile.findFirst({ where: { userId: id, fromId: body.fromId } });

                if (!findPendingProfiel) {
                    const addPendingProfile = await this.prisma.pandigProfile.create({
                        data: {
                            userId: id,
                            fromId: body.fromId,
                            message: body.message,
                            coins: body.coins
                        }
                    })

                    if (!addPendingProfile) {
                        throw new Error(`Ошибка в отправке лайка: ${JSON.stringify(addPendingProfile)}`);
                    }

                    console.log(addPendingProfile)
                }

                await axios.post(`https://api.telegram.org/bot${process.env.TELEG_TOKEN}/sendMessage`, {
                    chat_id: id,
                    text: `<b>🔥 Кто-то заинтересовался вашей анкетой!</b>\n\nПерейдите в меню <b>"❤️ Лайки"</b>, чтобы увидеть, кто проявил интерес к вашей анкете!`,
                    parse_mode: "HTML"
                })

                return { message: 'Пользователь обновлен', status: 200 }
            }


        } catch (err) {
            if (err instanceof Error) {
                return { message: err.message, status: 400 }
            }

            return { message: err, status: 400 }
        }
    }

    async DISLIKE(id: string) {
        try {
            const updateUser = await this.prisma.userBot.update({
                where: { id: id },
                data: {
                    dislike: {
                        increment: 1
                    }
                }
            });

            if (!updateUser) {
                throw new Error(`Ошибка в обновлении юзера: ${JSON.stringify(updateUser)}`);
            }

            return { message: 'Пользователь обновлен', status: 200, premium: updateUser.premium }
        } catch (err) {
            if (err instanceof Error) {
                return { message: err.message, status: 400 }
            }

            return { message: err, status: 400 }
        }
    }

    async MESSAGE(id: string, message: string) {
        try {

        } catch (err) {
            if (err instanceof Error) {
                return { message: err.message, status: 400 }
            }

            return { message: err, status: 400 }
        }
    }

    async BROADGEMS(fromId: string, toId: string, count: number) {
        try {
            const fromUser = await this.prisma.userBot.findFirst({
                where: { id: fromId },
                select: { coin: true }
            });

            if (!fromUser || fromUser.coin < count) {
                return { message: "Недостаточно средств!", status: 401 }
            }

            const updateFromId = await this.prisma.userBot.update({
                where: { id: fromId },
                data: {
                    coin: {
                        decrement: count
                    }
                }
            });

            if (!updateFromId) {
                throw new Error('Ошибка в обновлении счета отправляющего юзера');
            }

            const updateToId = await this.prisma.userBot.update({
                where: { id: toId },
                data: {
                    coin: {
                        increment: count
                    }
                }
            });

            if (!updateToId) {
                throw new Error('Ошибка в обновлении счета получающего юзера');
            }

            return { message: 'Успешное обновление счетов юзеров!' }
        } catch (err) {
            if (err instanceof Error) {
                return { message: `${err.message}`, status: 400 };
            } else {
                return { message: `Invalid Error: ${err}`, status: 400 };
            }
        }
    }
}