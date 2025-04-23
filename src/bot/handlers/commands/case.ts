import { editMessageOnlyText } from './../search/getAnket';
import axios from 'axios';
import { MyContext } from './../../interfaces/state';
import { Scenes } from "telegraf";
import { redis } from '../..';
import { handleCommand1 } from './handle';

async function updateUserCases(ctx: any) {
    const url = process.env.URL;

    const dataCaseCheck = await redis.hgetall(`case-${ctx.from?.id}`);

    if (Object.keys(dataCaseCheck).length === 0) {
        try {
            const req = await axios.get(`${url}/users/${ctx.from?.id}`);

            if (req.status === 400) {
                throw new Error(`Ошибка: ${JSON.stringify(req.data.message)}`);
            }

            const user = req.data.message;

            await redis.hset(`case-${ctx.from?.id}`, {
                caseBronza: user.caseBronza,
                caseSilver: user.caseSilver,
                caseGold: user.caseGold,
                casePlatinum: user.casePlatinum,
                caseMystery: user.caseMystery,
                caseEveryDay: user.caseEveryDay,
            });

        } catch (err) {
            if (err instanceof Error) {
                console.error(err.message);
            }
            ctx.reply('Ошибка в получении данных о кейсе! Попробуй еще раз');
        }

        await redis.expire(`case-${ctx.from?.id}`, 600);
    }
}

function getRandomInRange(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function updateUserScore(count: number, id: number) {
    try {
        const url = process.env.URL;

        const req = await axios.put(`${url}/users/${id}/gems`, {
            count: count,
            action: "increment"
        });

        if (req.status === 400) {
            throw new Error(JSON.stringify(req.data.message));
        }

        return true
    } catch (err) {
        console.error(err);
        return false
    }
}

async function updateCase(caseType: string, action: "increment" | "decrement", id: number) {
    try {
        const url = process.env.URL;

        const req = await axios.put(`${url}/users/${id}/case`, {
            caseType: caseType,
            action: action
        });

        if (req.status === 400) {
            throw new Error(JSON.stringify(req.data.message));
        }

        return true
    } catch (err) {
        console.error(err);
        return false
    }
}

async function byeCase(caseType: string, id: number, price: number) {
    try {
        const url = process.env.URL;

        const reqGems = await axios.put(`${url}/users/${id}/gems`, {
            count: price,
            action: "decrement"
        }, {
            validateStatus: (status) => status < 500
        });

        if (reqGems.status === 400) {
            throw new Error('❌ Ошибка платежа! Проверьте баланс и попробуйте снова.');
        }

        const updateCaseBye = await updateCase(caseType, "increment", id);

        if (!updateCaseBye) {
            throw new Error('⚠️ Не удалось обновить статус кейса. Попробуйте еще раз.');
        }

        return { status: true, message: '🎉 Покупка успешна! Перейдите в меню кейса и откройте его.' };
    } catch (err) {
        console.error(err);

        if (err instanceof Error) {
            return { status: false, message: `${err.message}` };
        }

        return { status: false, message: '❗ Произошла ошибка! Попробуйте еще раз.' };
    }
}

function getRandomCase(): string {
    const random = Math.random() * 100;

    if (random < 45) return "caseBronza";
    if (random < 80) return "caseSilver";
    if (random < 95) return "caseGold";
    return "casePlatinum";
}

function getRandomCaseEveryDayDefault(): string {
    const random = Math.random() * 100;

    if (random < 55) return "caseBronza";
    if (random < 90) return "caseSilver";
    return "caseGold";
}

function getRandomCaseEveryDayPremium(): string {
    const random = Math.random() * 100;

    if (random < 45) return "caseSilver";
    if (random < 75) return "caseGold";
    return "casePlatinum";
}

export const caseBronzaScene = new Scenes.WizardScene<MyContext>('caseBronzaScene', async (ctx) => {

    await updateUserCases(ctx);

    const dataCase = await redis.hgetall(`case-${ctx.from?.id}`);

    if (dataCase.caseBronza === '0') {
        const editMessage = await editMessageOnlyText(ctx,
            `<b>❌ У вас нет бронзовых кейсов!</b>\n\n` +
            `Не переживайте! Перейдите в магазин и <b>приобретите</b> бронзовый кейс, чтобы получить шанс на выигрыш! 💠\n\n` +
            `📦 <i>Кейс можно купить в магазине прямо сейчас.</i>`, {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'Магазин кейсов',
                            callback_data: 'shop-case'
                        }
                    ]
                ]
            }
        });

        if (!editMessage) {
            await ctx.reply('⚠️ Произошла ошибка! Попробуйте еще раз.');
            return
        }

        return ctx.wizard.next();
    }

    const caseText = dataCase.caseBronza === '1' ? 'кейс' : 'кейса';

    const editMessage = await editMessageOnlyText(ctx,
        `<b>📦 У вас есть ${dataCase.caseBronza} ${caseText} (Бронза)!</b>\n\n` +
        `В нем вы можете получить от <b>500 до 1000</b>! 💠 \n\n` +
        'Нажмите кнопку ниже, чтобы открыть ваш кейс.', {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: '🗝 Открыть кейс',
                        callback_data: 'open-case'
                    }
                ]
            ]
        }
    });

    if (!editMessage) {
        await ctx.reply('⚠️ Произошла ошибка! Попробуйте еще раз.');
        return
    }

    return ctx.wizard.next();
}, async (ctx) => {
    if (!ctx.callbackQuery) {
        if (ctx.message !== undefined) {
            if ('text' in ctx.message) {
                await handleCommand1(ctx);
            }
        }
        return
    }

    if ("data" in ctx.callbackQuery) {
        const dataCalback = ctx.callbackQuery.data;


        switch (dataCalback) {
            case 'shop-case':
                await ctx.scene.enter('caseShopScene')
                break
            case 'open-case':
                try {
                    const randomNumber = getRandomInRange(500, 1000);

                    const boolScore = await updateUserScore(randomNumber, ctx.from?.id || 0);

                    if (!boolScore) {
                        throw new Error('Ошибка в обновлении счета!');
                    }

                    const boolCase = await updateCase('caseBronza', "decrement", ctx.from?.id || 0)

                    if (!boolCase) {
                        throw new Error('Ошибка в обновлении кейса!');
                    }

                    const editMessage = await editMessageOnlyText(ctx,
                        `<b>🎉 Поздравляем!</b>\n\nТы выиграл <b>${randomNumber} гемов</b>! 💠\n\nНе забудь проверить свои кейсы и открыть их!`, {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: 'Кейсы',
                                        callback_data: 'case'
                                    }
                                ]
                            ]
                        }
                    });

                    if (!editMessage) {
                        await ctx.reply('⚠️ Произошла ошибка! Попробуйте еще раз.');
                        return
                    }

                    return ctx.wizard.next();

                } catch (err) {
                    if (err instanceof Error) {
                        console.error(err.message);
                    } else {
                        console.error(err)
                    }
                    ctx.reply('Возникла ошибка! Попробуй еще раз.')
                }
                break
        }
    }
}, async (ctx) => {
    if (!ctx.callbackQuery) {
        if (ctx.message !== undefined) {
            if ('text' in ctx.message) {
                await handleCommand1(ctx);
            }
        }
        return
    }

    if ("data" in ctx.callbackQuery) {
        const dataCalback = ctx.callbackQuery.data;
        if (dataCalback === 'case') {
            ctx.session.exitGems = true;
            await ctx.scene.enter('caseScene')
        } else {
            await ctx.reply('⚠️ Используйте кнопки!')
        }

    }
});

export const caseEveryDayScene = new Scenes.WizardScene<MyContext>('caseEveryDayScene', async (ctx) => {
    await updateUserCases(ctx);

    const dataCase = await redis.hgetall(`case-${ctx.from?.id}`);

    if (dataCase.caseEveryDay === '0') {
        const editMessage = await editMessageOnlyText(ctx,
            `<b>❌ У вас нет доступных кейсов на сегодня!</b>\n\n` +
            `Не переживайте! Вы можете получать <b>бесплатный кейс</b> каждый день.\n` +
            `Либо перейдите в магазин и <b>приобретите</b> кейсы, чтобы получить шанс на выигрыш! 💠\n\n` +
            `📦 <i>Кейс можно купить в магазине прямо сейчас.</i>`, {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'Магазин кейсов',
                            callback_data: 'shop-case'
                        }
                    ]
                ]
            }
        }
        );

        if (!editMessage) {
            await ctx.reply('⚠️ Произошла ошибка! Попробуйте еще раз.');
            return;
        }

        return ctx.wizard.next();
    }

    const editMessage = await editMessageOnlyText(ctx,
        `<b>📦 У вас есть 1 кейс (Бесплатный)!</b>\n\n` +
        `Открыв его, вы можете получить один из следующих кейсов:\n\n` +
        `<b>💘 Обычные шансы:</b>\n` +
        `- Бронзовый (55%)\n` +
        `- Серебряный (35%)\n` +
        `- Золотой (10%)\n\n` +
        `<b>⭐ Шансы с премиум-доступом:</b>\n` +
        `- Серебряный (45%)\n` +
        `- Золотой (30%)\n` +
        `- Платиновый (25%)\n\n` +
        `Нажмите кнопку ниже, чтобы открыть ваш кейс.`, {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: '🗝 Открыть кейс',
                        callback_data: 'open-case'
                    }
                ]
            ]
        }
    }
    );

    if (!editMessage) {
        await ctx.reply('⚠️ Произошла ошибка! Попробуйте еще раз.');
        return;
    }

    return ctx.wizard.next();
}, async (ctx) => {
    if (!ctx.callbackQuery) {
        if (ctx.message !== undefined) {
            if ('text' in ctx.message) {
                await handleCommand1(ctx);
            }
        }
        return
    }

    if ("data" in ctx.callbackQuery) {
        const dataCalback = ctx.callbackQuery.data;


        switch (dataCalback) {
            case 'shop-case':
                await ctx.scene.enter('caseShopScene')
                break
            case 'open-case':
                try {

                    const userData1 = await redis.hgetall(`user-${ctx.from?.id}`);

                    if (Object.keys(userData1).length === 0) {
                        const url = process.env.URL;

                        const req = await axios.get(`${url}/users/${ctx.from?.id}`);

                        if (req.status === 400) {
                            throw new Error(`Ошибка: ${JSON.stringify(req.data.message)}`);
                        }

                        const user = req.data.message;

                        await redis.hset(`user-${ctx.from?.id}`, {
                            name: user.name,
                            description: user.description,
                            photo: user.photo,
                            city: user.city,
                            age: user.age.toString(),
                            minAge: user.minAge.toString(),
                            maxAge: user.maxAge.toString(),
                            likeWieved: user.likeWieved ? '1' : '0',
                            dislikeWieved: user.dislikeWieved ? '1' : '0',
                            coinWieved: user.coinWieved ? '1' : '0',
                            premium: user.premium ? '1' : '0',
                            role: user.role
                        });
                    }

                    const userData = await redis.hget(`user-${ctx.from?.id}`, 'premium');

                    let randomCase;

                    if (userData === '1') {
                        randomCase = getRandomCaseEveryDayPremium();
                    } else {
                        randomCase = getRandomCaseEveryDayDefault();
                    }

                    const boolCaseEveryDay = await updateCase('caseEveryDay', "decrement", ctx.from?.id || 0)

                    if (!boolCaseEveryDay) {
                        throw new Error('Ошибка в обновлении кейса!');
                    }

                    const boolCase = await updateCase(randomCase, "increment", ctx.from?.id || 0)

                    if (!boolCase) {
                        throw new Error('Ошибка в обновлении кейса!');
                    }

                    let caseName = '';

                    switch (randomCase) {
                        case 'caseBronza':
                            caseName = 'бронзовый'
                            break
                        case 'caseSilver':
                            caseName = 'серебрянный'
                            break
                        case 'caseGold':
                            caseName = 'золотой'
                            break
                        case 'casePlatinum':
                            caseName = 'платиновый'
                            break
                        default:
                            break
                    }

                    const editMessage = await editMessageOnlyText(ctx,
                        `<b>🎉 Поздравляем!</b>\n\nТы выиграл <b>${caseName} кейс</b>! 📦\n\nНе забудь проверить свои кейсы и открыть их!`, {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: 'Кейсы',
                                        callback_data: 'case'
                                    }
                                ]
                            ]
                        }
                    });

                    if (!editMessage) {
                        await ctx.reply('⚠️ Произошла ошибка! Попробуйте еще раз.');
                        return
                    }

                    return ctx.wizard.next();
                } catch (err) {
                    if (err instanceof Error) {
                        console.error(err.message);
                    } else {
                        console.error(err)
                    }
                    ctx.reply('Возникла ошибка! Попробуй еще раз.')
                }
                break
        }
    }
}, async (ctx) => {
    if (!ctx.callbackQuery) {
        if (ctx.message !== undefined) {
            if ('text' in ctx.message) {
                await handleCommand1(ctx);
            }
        }
        return
    }

    if ("data" in ctx.callbackQuery) {
        const dataCalback = ctx.callbackQuery.data;
        if (dataCalback === 'case') {
            ctx.session.exitGems = true;
            await ctx.scene.enter('caseScene')
        } else {
            await ctx.reply('⚠️ Используйте кнопки!')
        }

    }
});

export const caseSilverScene = new Scenes.WizardScene<MyContext>('caseSilverScene', async (ctx) => {
    await updateUserCases(ctx);

    const dataCase = await redis.hgetall(`case-${ctx.from?.id}`);

    if (dataCase.caseSilver === '0') {
        const editMessage = await editMessageOnlyText(ctx,
            `<b>❌ У вас нет серебряных кейсов!</b>\n\n` +
            `Не переживайте! Перейдите в магазин и <b>приобретите</b> серебряный кейс, чтобы получить шанс на выигрыш! 💠\n\n` +
            `📦 <i>Кейс можно купить в магазине прямо сейчас.</i>`, {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'Магазин кейсов',
                            callback_data: 'shop-case'
                        }
                    ]
                ]
            }
        });

        if (!editMessage) {
            await ctx.reply('⚠️ Произошла ошибка! Попробуйте еще раз.');
            return;
        }

        return ctx.wizard.next();
    }

    const caseText = dataCase.caseSilver === '1' ? 'кейс' : 'кейса';

    const editMessage = await editMessageOnlyText(ctx,
        `<b>📦 У вас есть ${dataCase.caseSilver} ${caseText} (Серебро)!</b>\n\n` +
        `В нем вы можете получить от <b>1000 до 2500</b>! 💠\n\n` +
        'Нажмите кнопку ниже, чтобы открыть ваш кейс.', {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: '🗝 Открыть кейс',
                        callback_data: 'open-case'
                    }
                ]
            ]
        }
    });

    if (!editMessage) {
        await ctx.reply('⚠️ Произошла ошибка! Попробуйте еще раз.');
        return;
    }

    return ctx.wizard.next();
}, async (ctx) => {
    if (!ctx.callbackQuery) {
        if (ctx.message !== undefined) {
            if ('text' in ctx.message) {
                await handleCommand1(ctx);
            }
        }
        return
    }

    if ("data" in ctx.callbackQuery) {
        const dataCalback = ctx.callbackQuery.data;


        switch (dataCalback) {
            case 'shop-case':
                await ctx.scene.enter('caseShopScene')
                break
            case 'open-case':
                try {
                    const randomNumber = getRandomInRange(1000, 2500);

                    const boolScore = await updateUserScore(randomNumber, ctx.from?.id || 0);

                    if (!boolScore) {
                        throw new Error('Ошибка в обновлении счета!');
                    }

                    const boolCase = await updateCase('caseSilver', "decrement", ctx.from?.id || 0)

                    if (!boolCase) {
                        throw new Error('Ошибка в обновлении кейса!');
                    }

                    const editMessage = await editMessageOnlyText(ctx,
                        `<b>🎉 Поздравляем!</b>\n\nТы выиграл <b>${randomNumber} гемов</b>! 💠\n\nНе забудь проверить свои кейсы и открыть их!`, {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: 'Кейсы',
                                        callback_data: 'case'
                                    }
                                ]
                            ]
                        }
                    });

                    if (!editMessage) {
                        await ctx.reply('⚠️ Произошла ошибка! Попробуйте еще раз.');
                        return
                    }

                    return ctx.wizard.next();
                } catch (err) {
                    if (err instanceof Error) {
                        console.error(err.message);
                    } else {
                        console.error(err)
                    }
                    ctx.reply('Возникла ошибка! Попробуй еще раз.')
                }
                break
        }
    }
}, async (ctx) => {
    if (!ctx.callbackQuery) {
        if (ctx.message !== undefined) {
            if ('text' in ctx.message) {
                await handleCommand1(ctx);
            }
        }
        return
    }

    if ("data" in ctx.callbackQuery) {
        const dataCalback = ctx.callbackQuery.data;
        if (dataCalback === 'case') {
            ctx.session.exitGems = true;
            await ctx.scene.enter('caseScene')
        } else {
            await ctx.reply('⚠️ Используйте кнопки!')
        }

    }
});

export const caseGoldScene = new Scenes.WizardScene<MyContext>('caseGoldScene', async (ctx) => {
    await updateUserCases(ctx);

    const dataCase = await redis.hgetall(`case-${ctx.from?.id}`);

    if (dataCase.caseGold === '0') {
        const editMessage = await editMessageOnlyText(ctx,
            `<b>❌ У вас нет золотых кейсов!</b>\n\n` +
            `Не переживайте! Перейдите в магазин и <b>приобретите</b> золотой кейс, чтобы получить шанс на выигрыш! 💠\n\n` +
            `📦 <i>Кейс можно купить в магазине прямо сейчас.</i>`, {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'Магазин кейсов',
                            callback_data: 'shop-case'
                        }
                    ]
                ]
            }
        });

        if (!editMessage) {
            await ctx.reply('⚠️ Произошла ошибка! Попробуйте еще раз.');
            return;
        }

        return ctx.wizard.next();
    }

    const caseText = dataCase.caseGold === '1' ? 'кейс' : 'кейса';

    const editMessage = await editMessageOnlyText(ctx,
        `<b>📦 У вас есть ${dataCase.caseGold} ${caseText} (Золото)!</b>\n\n` +
        `В нем вы можете получить от <b>2500 до 5000</b>! 💠\n\n` +
        'Нажмите кнопку ниже, чтобы открыть ваш кейс.', {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: '🗝 Открыть кейс',
                        callback_data: 'open-case'
                    }
                ]
            ]
        }
    });

    if (!editMessage) {
        await ctx.reply('⚠️ Произошла ошибка! Попробуйте еще раз.');
        return;
    }

    return ctx.wizard.next();
}, async (ctx) => {
    if (!ctx.callbackQuery) {
        if (ctx.message !== undefined) {
            if ('text' in ctx.message) {
                await handleCommand1(ctx);
            }
        }
        return
    }

    if ("data" in ctx.callbackQuery) {
        const dataCalback = ctx.callbackQuery.data;


        switch (dataCalback) {
            case 'shop-case':
                await ctx.scene.enter('caseShopScene')
                break
            case 'open-case':
                try {
                    const randomNumber = getRandomInRange(2500, 5000);

                    const boolScore = await updateUserScore(randomNumber, ctx.from?.id || 0);

                    if (!boolScore) {
                        throw new Error('Ошибка в обновлении счета!');
                    }

                    const boolCase = await updateCase('caseGold', "decrement", ctx.from?.id || 0)

                    if (!boolCase) {
                        throw new Error('Ошибка в обновлении кейса!');
                    }

                    const editMessage = await editMessageOnlyText(ctx,
                        `<b>🎉 Поздравляем!</b>\n\nТы выиграл <b>${randomNumber} гемов</b>! 💠\n\nНе забудь проверить свои кейсы и открыть их!`, {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: 'Кейсы',
                                        callback_data: 'case'
                                    }
                                ]
                            ]
                        }
                    });

                    if (!editMessage) {
                        await ctx.reply('⚠️ Произошла ошибка! Попробуйте еще раз.');
                        return
                    }

                    return ctx.wizard.next();
                } catch (err) {
                    if (err instanceof Error) {
                        console.error(err.message);
                    } else {
                        console.error(err)
                    }
                    ctx.reply('Возникла ошибка! Попробуй еще раз.')
                    return
                }
                break
        }
    }
}, async (ctx) => {
    if (!ctx.callbackQuery) {
        if (ctx.message !== undefined) {
            if ('text' in ctx.message) {
                await handleCommand1(ctx);
            }
        }
        return
    }

    if ("data" in ctx.callbackQuery) {
        const dataCalback = ctx.callbackQuery.data;
        if (dataCalback === 'case') {
            ctx.session.exitGems = true;
            await ctx.scene.enter('caseScene')
        } else {
            await ctx.reply('⚠️ Используйте кнопки!')
        }

    }
});

export const casePlatinumScene = new Scenes.WizardScene<MyContext>('casePlatinumScene', async (ctx) => {
    await updateUserCases(ctx);

    const dataCase = await redis.hgetall(`case-${ctx.from?.id}`);

    if (dataCase.casePlatinum === '0') {
        const editMessage = await editMessageOnlyText(ctx,
            `<b>❌ У вас нет платиновых кейсов!</b>\n\n` +
            `Вы можете получить этот кейс <b>с некоторым шансом</b> каждый день или найти его в <b>мистическом кейсе</b>.\n\n` +
            `📦 <i>Испытайте удачу, открывая мистические кейсы, или подождите свой шанс!</i>`, {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'Магазин кейсов',
                            callback_data: 'shop-case'
                        }
                    ]
                ]
            }
        });

        if (!editMessage) {
            await ctx.reply('⚠️ Произошла ошибка! Попробуйте еще раз.');
            return;
        }

        return ctx.wizard.next();
    }

    const caseText = dataCase.casePlatinum === '1' ? 'кейс' : 'кейса';

    const editMessage = await editMessageOnlyText(ctx,
        `<b>📦 У вас есть ${dataCase.casePlatinum} ${caseText} (Платина)!</b>\n\n` +
        `В нем вы можете получить от <b>5000 до 10000</b>! 💠\n\n` +
        'Нажмите кнопку ниже, чтобы открыть ваш кейс.', {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: '🗝 Открыть кейс',
                        callback_data: 'open-case'
                    }
                ]
            ]
        }
    });

    if (!editMessage) {
        await ctx.reply('⚠️ Произошла ошибка! Попробуйте еще раз.');
        return;
    }

    return ctx.wizard.next();
}, async (ctx) => {
    if (!ctx.callbackQuery) {
        if (ctx.message !== undefined) {
            if ('text' in ctx.message) {
                await handleCommand1(ctx);
            }
        }
        return
    }

    if ("data" in ctx.callbackQuery) {
        const dataCalback = ctx.callbackQuery.data;


        switch (dataCalback) {
            case 'shop-case':
                await ctx.scene.enter('caseShopScene')
                break
            case 'open-case':
                try {
                    const randomNumber = getRandomInRange(5000, 10000);

                    const boolScore = await updateUserScore(randomNumber, ctx.from?.id || 0);

                    if (!boolScore) {
                        throw new Error('Ошибка в обновлении счета!');
                    }

                    const boolCase = await updateCase('casePlatinum', "decrement", ctx.from?.id || 0)

                    if (!boolCase) {
                        throw new Error('Ошибка в обновлении кейса!');
                    }

                    const editMessage = await editMessageOnlyText(ctx,
                        `<b>🎉 Поздравляем!</b>\n\nТы выиграл <b>${randomNumber} гемов</b>! 💠\n\nНе забудь проверить свои кейсы и открыть их!`, {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: 'Кейсы',
                                        callback_data: 'case'
                                    }
                                ]
                            ]
                        }
                    });

                    if (!editMessage) {
                        await ctx.reply('⚠️ Произошла ошибка! Попробуйте еще раз.');
                        return
                    }

                    return ctx.wizard.next();
                } catch (err) {
                    if (err instanceof Error) {
                        console.error(err.message);
                    } else {
                        console.error(err)
                    }
                    ctx.reply('Возникла ошибка! Попробуй еще раз.')
                }
                break
        }
    }
}, async (ctx) => {
    if (!ctx.callbackQuery) {
        if (ctx.message !== undefined) {
            if ('text' in ctx.message) {
                await handleCommand1(ctx);
            }
        }
        return
    }

    if ("data" in ctx.callbackQuery) {
        const dataCalback = ctx.callbackQuery.data;
        if (dataCalback === 'case') {
            ctx.session.exitGems = true;
            await ctx.scene.enter('caseScene')
        } else {
            await ctx.reply('⚠️ Используйте кнопки!')
        }

    }
});

export const caseMysteryScene = new Scenes.WizardScene<MyContext>('caseMysteryScene', async (ctx) => {
    await updateUserCases(ctx);

    const dataCase = await redis.hgetall(`case-${ctx.from?.id}`);

    if (dataCase.caseMystery === '0') {
        const editMessage = await editMessageOnlyText(ctx,
            `<b>❌ У вас нет мистических кейсов!</b>\n\n` +
            `Не переживайте! Перейдите в магазин и <b>приобретите</b> мистический кейс, чтобы получить шанс на выигрыш! 💠\n\n` +
            `📦 <i>Кейс можно купить в магазине прямо сейчас.</i>`, {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'Магазин кейсов',
                            callback_data: 'shop-case'
                        }
                    ]
                ]
            }
        });

        if (!editMessage) {
            await ctx.reply('⚠️ Произошла ошибка! Попробуйте еще раз.');
            return;
        }

        return ctx.wizard.next();
    }

    const caseText = dataCase.caseMystery === '1' ? 'кейс' : 'кейса';

    const editMessage = await editMessageOnlyText(ctx,
        `<b>📦 У вас есть ${dataCase.caseMystery} ${caseText} (Мистика)!</b>\n\n` +
        `Открыв его, вы можете получить один из следующих кейсов:\n` +
        `- Бронзовый (45%)\n` +
        `- Серебряный (35%)\n` +
        `- Золотой (15%)\n` +
        `- Платиновый (5%)\n\n` +
        `Нажмите кнопку ниже, чтобы открыть ваш кейс.`, {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: '🗝 Открыть кейс',
                        callback_data: 'open-case'
                    }
                ]
            ]
        }
    });

    if (!editMessage) {
        await ctx.reply('⚠️ Произошла ошибка! Попробуйте еще раз.');
        return;
    }

    return ctx.wizard.next();
}, async (ctx) => {
    if (!ctx.callbackQuery) {
        if (ctx.message !== undefined) {
            if ('text' in ctx.message) {
                await handleCommand1(ctx);
            }
        }
        return
    }

    if ("data" in ctx.callbackQuery) {
        const dataCalback = ctx.callbackQuery.data;

        console.log('dataCalback', dataCalback);

        switch (dataCalback) {
            case 'shop-case':
                await ctx.scene.enter('caseShopScene')
                break
            case 'open-case':
                try {
                    const randomCase = getRandomCase();

                    const boolCaseMystary = await updateCase('caseMystery', "decrement", ctx.from?.id || 0)

                    if (!boolCaseMystary) {
                        throw new Error('Ошибка в обновлении кейса!');
                    }

                    const boolCase = await updateCase(randomCase, "increment", ctx.from?.id || 0)

                    if (!boolCase) {
                        throw new Error('Ошибка в обновлении кейса!');
                    }

                    let caseName = '';

                    switch (randomCase) {
                        case 'caseBronza':
                            caseName = 'бронзовый'
                            break
                        case 'caseSilver':
                            caseName = 'серебрянный'
                            break
                        case 'caseGold':
                            caseName = 'золотой'
                            break
                        case 'casePlatinum':
                            caseName = 'платиновый'
                            break
                        default:
                            break
                    }

                    const editMessage = await editMessageOnlyText(ctx,
                        `<b>🎉 Поздравляем!</b>\n\nТы выиграл <b>${caseName} кейс</b>! 📦\n\nНе забудь проверить свои кейсы и открыть их!`, {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: 'Кейсы',
                                        callback_data: 'case'
                                    }
                                ]
                            ]
                        }
                    });

                    if (!editMessage) {
                        await ctx.reply('⚠️ Произошла ошибка! Попробуйте еще раз.');
                        return
                    }

                    return ctx.wizard.next();
                } catch (err) {
                    if (err instanceof Error) {
                        console.error(err.message);
                    } else {
                        console.error(err)
                    }
                    ctx.reply('Возникла ошибка! Попробуй еще раз.')
                }
                break
            default:
                console.warn(`Неизвестный callback: ${dataCalback}`);
                await ctx.reply('⚠️ Произошла ошибка! Попробуй еще раз.');
                break;
        }
    }
}, async (ctx) => {
    if (!ctx.callbackQuery) {
        if (ctx.message !== undefined) {
            if ('text' in ctx.message) {
                await handleCommand1(ctx);
            }
        }
        return
    }

    if ("data" in ctx.callbackQuery) {
        const dataCalback = ctx.callbackQuery.data;
        if (dataCalback === 'case') {
            ctx.session.exitGems = true;
            await ctx.scene.enter('caseScene')
        } else {
            await ctx.reply('⚠️ Используйте кнопки!')
        }

    }
});

export const caseShopScene = new Scenes.WizardScene<MyContext>('caseShopScene', async (ctx) => {
    const editMessage = await editMessageOnlyText(ctx,
        `<b>🛒 Выберите кейс для покупки:</b>\n\n` +
        `1️⃣ <b>Бронзовый</b> — <b>750</b> 💠\n` +
        `2️⃣ <b>Серебряный</b> — <b>1 750</b> 💠\n` +
        `3️⃣ <b>Золотой</b> — <b>3 750</b> 💠\n` +
        `4️⃣ <b>Мистический</b> — <b>3 500</b> 💠\n` +
        `5️⃣ <b>Вернуться назад</b>\n\n` +
        `📌 Выбери действие, нажав на соответствующую кнопку ниже.`, {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: '1',
                        callback_data: '1-case'
                    },
                    {
                        text: '2',
                        callback_data: '2-case'
                    }
                ],
                [
                    {
                        text: '3',
                        callback_data: '3-case'
                    },
                    {
                        text: '4',
                        callback_data: '4-case'
                    },
                ],
                [
                    {
                        text: '5',
                        callback_data: '5-case'
                    }
                ]
            ]
        }
    });

    if (!editMessage) {
        await ctx.reply('⚠️ Произошла ошибка! Попробуйте еще раз.');
        return
    }

    return ctx.wizard.next();
}, async (ctx) => {
    if (!ctx.callbackQuery) {
        if (ctx.message !== undefined) {
            if ('text' in ctx.message) {
                await handleCommand1(ctx);
            }
        }
        return
    }

    if ("data" in ctx.callbackQuery) {
        const dataCalback = ctx.callbackQuery.data;

        switch (dataCalback) {
            case '1-case':
                const caseBronza = await byeCase("caseBronza", ctx.from?.id || 0, 750);
                ctx.session.exitGems = true;
                return ctx.scene.enter('caseScene');

            case '2-case':
                const caseSilver = await byeCase("caseSilver", ctx.from?.id || 0, 1750);
                ctx.session.exitGems = true;
                return ctx.scene.enter('caseScene');

            case '3-case':
                const caseGold = await byeCase("caseGold", ctx.from?.id || 0, 3750);
                ctx.session.exitGems = true;
                return ctx.scene.enter('caseScene');

            case '4-case':
                const caseMystery = await byeCase("caseMystery", ctx.from?.id || 0, 3500);
                ctx.session.exitGems = true;
                return ctx.scene.enter('caseScene');

            case '5-case':
                if (ctx.session.shop) {
                    ctx.session.shop = false;
                    ctx.session.exitGems = true;
                    
                    return ctx.scene.enter('shopScene');
                }

                ctx.session.exitGems = true;
                return ctx.scene.enter('caseScene');

            default:
                break
        }
    }
});