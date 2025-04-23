import { PrismaClient } from "@prisma/client";
import { redis } from "../server";

export const checkPremium = async () => {
    try {
        const now = new Date();
        const prisma = new PrismaClient();

        console.log(now);

        const result = await prisma.userBot.updateMany({
            where: {
                premium: true,
                premiumTime: {
                    lte: now
                }
            },
            data: {
                premium: false,
                premiumTime: null,
            }
        });

        return { message: '✅ Проверка прошла успешно' }
    } catch (err) {
        if (err instanceof Error) {
            return { message: `❌ Ошибка при обновлении премиумов: ${err.message}` }

        }

        return { message: `❌ Ошибка при обновлении премиумов: ${err}` }
    }
}

export async function deleteUserInteractions() {
    try {
        const BATCH_SIZE = 100;
        let cursor = '0';
        let totalDeleted = 0;
        const startTime = Date.now();

        do {
            const [newCursor, keys] = await redis.scan(
                cursor,
                'MATCH',
                'user-interactions-*',
                'COUNT',
                BATCH_SIZE
            );

            if (keys.length > 0) {
                await redis.del(keys);
                totalDeleted += keys.length;
                console.log(`Удалено ${keys.length} ключей (всего: ${totalDeleted})`);
            }

            cursor = newCursor;

            await new Promise(resolve => setTimeout(resolve, 50));

        } while (cursor !== '0');
        const executionTime = ((Date.now() - startTime) / 1000).toFixed(2);
        const time = new Date().toLocaleTimeString('ru-RU', {
            timeZone: 'Europe/Moscow'
        });
        console.log(`[${time}] Удаление завершено. Всего ключей: ${totalDeleted}, Время: ${executionTime} сек`);

    } catch (error) {
        console.error('Ошибка при удалении:', error);
    }
}

export async function addCaseEveryDayField() {
    const prisma = new PrismaClient();

    try {
        await prisma.userBot.updateMany({
            data: {
                caseEveryDay: 1,
            },
        });
        return { message: '✅ Проверка прошла успешно' }
    } catch (err) {
        if (err instanceof Error) {
            return { message: `❌ Ошибка при добавлении каждожневного кейса: ${err.message}` }

        }

        return { message: `❌ Ошибка при добавлении каждожневного кейса: ${err}` }
    }
}

export async function updateTop() {
    const prisma = new PrismaClient();

    try {

        await prisma.$executeRaw`
    WITH ranked AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY coin DESC) AS rank
        FROM "UserBot"
        WHERE banned = false AND shutdown = false
    )
    UPDATE "UserBot"
    SET top = ranked.rank
    FROM ranked
    WHERE "UserBot".id = ranked.id;
`;


        await prisma.$executeRaw`
    UPDATE "UserBot"
    SET top = 0
    WHERE id NOT IN (
        SELECT id
        FROM "UserBot"
        WHERE banned = false AND shutdown = false
    );
`;


        return { message: '✅Обновление топа прошло успешно' }
    } catch (err) {
        if (err instanceof Error) {
            return { message: `❌ Ошибка при обновлении каждожневного топа: ${err.message}` }

        }

        return { message: `❌ Ошибка при обновлении каждожневного топа: ${err}` }
    }
}

// export async function updateTop() {
//     const prisma = new PrismaClient();

//     try {
//         await prisma.$executeRaw`
//         WITH ranked AS (
//         SELECT id, ROW_NUMBER() OVER (ORDER BY coin DESC) AS rank
//         FROM "UserBot"
//         )
//         UPDATE "UserBot"
//         SET top = ranked.rank
//         FROM ranked
//         WHERE "UserBot".id = ranked.id;
//       `;
//         return { message: '✅Обновление топа прошло успешно' }
//     } catch (err) {
//         if (err instanceof Error) {
//             return { message: `❌ Ошибка при обновлении каждожневного топа: ${err.message}` }

//         }

//         return { message: `❌ Ошибка при обновлении каждожневного топа: ${err}` }
//     }
// }

export async function deleteChanelsInSearch() {
    try {
        const now = new Date();
        const prisma = new PrismaClient();

        const deletedChannels = await prisma.advertisement.deleteMany({
            where: {
                due: {
                    lte: now
                }
            }
        });

        console.log("deletedChannels", deletedChannels)

        return { message: '✅ Проверка прошла успешно' }
    } catch (err) {
        if (err instanceof Error) {
            return { message: `❌ Ошибка при обновлении премиумов: ${err.message}` }

        }

        return { message: `❌ Ошибка при обновлении премиумов: ${err}` }
    }
}

export const deleteSearchRedis = async () => {
    try {
        const keys = await redis.keys("viewed-*");
        if (keys.length > 0) {

            await redis.del(...keys);
            return { message: `✅ Все списки удалены` }
        } else {
            return { message: `✅ Списков с шаблоном 'viewed-*' не найдено` }
        }
    } catch (err) {
        if (err instanceof Error) {
            return { message: `❌ Ошибка при очищении viewed у redis: ${err.message}` }

        }

        return { message: `❌ Ошибка при очищении viewed у redis: ${err}` }
    }
}

export const searchViewed = async () => {
    const prisma = new PrismaClient();

    try {
        await prisma.viewedProfile.deleteMany();
        return { message: '✅ Удаление Viewed успешно!' }
    } catch (err) {
        if (err instanceof Error) {
            return { message: `❌ Ошибка при очищении viewed: ${err.message}` }

        }

        return { message: `❌ Ошибка при очищении viewed: ${err}` }
    }
}

