import axios from 'axios';
import { MyContext } from './../interfaces/state';
import { Scenes } from "telegraf";
import { redis } from '..';
import { formatText, handleCommand1, formatNumber, getTopIcon } from '../handlers/commands/handle';
import { checkSubscriptionMiddleware } from '..';
import { PhotoSize } from 'telegraf/typings/core/types/typegram';
import { editMessage as editMessageFromGetAnket } from '../handlers/search/getAnket';

export const adminScene = new Scenes.WizardScene<MyContext>('adminScene', async (ctx) => {
    try {
        const url = process.env.URL;

        const getUser = await axios.get(`${url}/users/${ctx.from?.id}`);

        const user = getUser.data.message;

        if (user.role !== 'admin') {
            await ctx.reply('⛔ У вас недостаточно прав для выполнения этого действия.');
            return ctx.scene.leave();
        }

        const adminMessage = `  
 🛠️ <b>Режим администратора</b>  
———————————————  
📌 Вы находитесь в <b>режиме администратора</b>.  
Теперь у вас есть доступ к следующим действиям:  
                
1️⃣ Введите <b>User ID</b>, чтобы получить информацию о пользователе и выполнить одно из следующих действий:  
🔹 <b>Забанить</b> или <b>разбанить</b> пользователя  
🔹 <b>Выдать</b> пользователю <b>премиум-доступ</b>  
                
2️⃣ Создать <b>глобальное объявление</b> для всех пользователей.  
        
3️⃣ Настроить <b>подписку на каналы</b>.

4️⃣ Настроить <b>рекламу в ленте</b>.
———————————————  
 `;


        const adminButtons = [
            [{ text: 'Ввести ID пользователя', callback_data: 'enter_user_id' }],
            [{ text: 'Создать объявление', callback_data: 'create_announcement' }],
            [{ text: 'Подписка на каналы', callback_data: 'subscription_chanels' }],
            [{ text: 'Реклама в ленте', callback_data: 'search_chanels' }],
        ];

        await ctx.reply(adminMessage, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: adminButtons
            }
        });


        return ctx.wizard.next();
    } catch (err) {
        if (err instanceof Error) {
            console.error(err.message);
        } else {
            console.error(err)
        }
        ctx.reply(`${err instanceof Error ? err.message : 'Please, check console'}`);
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

    if ('data' in ctx.callbackQuery) {
        const message = ctx.callbackQuery.data;

        switch (message) {
            case 'enter_user_id':
                return ctx.scene.enter('sessionUser');

            case 'create_announcement':
                return ctx.scene.enter('advertisemenScene');

            case 'subscription_chanels':
                return ctx.scene.enter('chanelsScene');

            case 'search_chanels':
                return ctx.scene.enter('advertisementInSearch');

            default:
                break
        }
    }
})

export const unbanScene = new Scenes.WizardScene<MyContext>('unbanScene', async (ctx) => {
    try {
        const url = process.env.URL;

        const userId = await redis.get(`session-${ctx.from?.id}`);

        const req = await axios.post(`${url}/report/${userId}/unbanned`);

        if (req.status === 400) {
            throw new Error(JSON.stringify(req.data.message));
        }

        ctx.reply(`<b>Юзер ${userId}</b> успешно разбанен! 🎉`, {
            parse_mode: 'HTML'
        });

        return ctx.scene.leave();
    } catch (err) {
        if (err instanceof Error) {
            console.error(err.message);
        } else {
            console.error(err)
        }
        ctx.reply(`${err instanceof Error ? err.message : 'Please, check console'}`);
    }
});

export const banScene = new Scenes.WizardScene<MyContext>('banScene', async (ctx) => {
    ctx.reply('Выберете, на сколько забанить юзера', {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: '1 день',
                        callback_data: 'day_1'
                    }
                ],
                [
                    {
                        text: '7 дней',
                        callback_data: 'day_7'
                    }
                ],
                [
                    {
                        text: '30 дней',
                        callback_data: 'day_30'
                    }
                ],
                [
                    {
                        text: '365 дней',
                        callback_data: 'day_365'
                    }
                ],
            ]
        }
    });

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

    let daylet;

    if ('data' in ctx.callbackQuery) {
        const day = ctx.callbackQuery.data.split("_")[1]

        daylet = Number(day);
    }

    try {
        const url = process.env.URL;

        const userId = await redis.get(`session-${ctx.from?.id}`);

        const req = await axios.post(`${url}/report/${userId}/banned`, {
            days: daylet
        });

        if (req.status === 400) {
            throw new Error(JSON.stringify(req.data.message));
        }

        await ctx.reply(`<b>Юзер ${userId}</b> успешно забанен на <b>${daylet === 1 ? `${daylet} день` : `${daylet} дней`}</b>! 🎉\nТеперь он не сможет больше нарушать правила. 🚫`, {
            parse_mode: 'HTML'
        });

        return ctx.scene.leave();
    } catch (err) {
        if (err instanceof Error) {
            console.error(err.message);
        } else {
            console.error(err)
        }
        ctx.reply(`${err instanceof Error ? err.message : 'Please, check console'}`);
    }
});

export const premiumSceneAdmin = new Scenes.WizardScene<MyContext>('premiumSceneAdmin', async (ctx) => {
    ctx.reply('Выберете, на сколько юзеру выдать премиум', {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: '1 день',
                        callback_data: 'day_1'
                    }
                ],
                [
                    {
                        text: '7 дней',
                        callback_data: 'day_7'
                    }
                ],
                [
                    {
                        text: '30 дней',
                        callback_data: 'day_30'
                    }
                ],
                [
                    {
                        text: '365 дней',
                        callback_data: 'day_365'
                    }
                ],
            ]
        }
    });

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

    let daylet;

    if ('data' in ctx.callbackQuery) {
        const day = ctx.callbackQuery.data.split("_")[1]

        daylet = Number(day);
    }

    try {
        const url = process.env.URL;
        const userId = await redis.get(`session-${ctx.from?.id}`);


        const req = await axios.put(`${url}/users/${userId}/premium`, {
            premium: true,
            days: daylet
        });


        if (req.status === 400) {
            throw new Error(JSON.stringify(req.data));
        }

        await ctx.reply(`Юзер ${userId} успешно получил премиум на ${daylet === 1 ? `${daylet} день` : `${daylet} дней`}`);

        return ctx.scene.leave();
    } catch (err) {
        if (err instanceof Error) {
            console.error(err.message);
        } else {
            console.error(err)
        }
        ctx.reply(`${err instanceof Error ? err.message : 'Please, check console'}`);
        return ctx.scene.leave();
    }
});

export const sessionUser = new Scenes.WizardScene<MyContext>('sessionUser', async (ctx) => {
    await ctx.reply('🔍 Пожалуйста, введите <b>User ID</b> пользователя для получения информации и выполнения действий.', { parse_mode: 'HTML' });

    return ctx.wizard.next();
}, async (ctx) => {
    if (!ctx.callbackQuery) {
        if (ctx.message !== undefined) {
            if ('text' in ctx.message) {
                const message = ctx.message?.text;

                if (ctx.session.sendMessage) {
                    const result = await editMessageFromGetAnket(ctx);

                    if (!result) {
                        console.log('Ошибка в исправлении сообщения!');
                    }
                }

                if (message.startsWith('/')) {
                    switch (message) {
                        case '/profile':
                            return ctx.scene.enter('profileScene');
                        case '/search':
                            return ctx.scene.enter('ancetScene');
                        case '/likes':
                            return ctx.scene.enter('getLikes');
                        case '/metches':
                            return ctx.scene.enter('getMetch');
                        case '/reported':
                            return ctx.scene.enter('reportScene');
                        case '/help':
                            await ctx.reply(
                                'Доступные команды:\n\n' +
                                '🔹 <b>/profile</b> - Перейти в профиль\n' +
                                '🔹 <b>/search</b> - Начать поиск анкет\n' +
                                '🔹 <b>/likes</b> - Просмотр ваших лайков\n' +
                                '🔹 <b>/metches</b> - Просмотр метчей\n' +
                                '🔹 <b>/help</b> - Список доступных команд',
                                {
                                    parse_mode: 'HTML'
                                }
                            );
                            break;
                        case '/luchaevaMuda':
                            return ctx.scene.enter('adminScene');
                        case '/reported':
                            return ctx.scene.enter('reportScene');
                        default:
                            await ctx.reply('❌ Неизвестная команда. Попробуйте /help для получения списка доступных команд.');
                            break;
                    }
                    return;
                }

                switch (message) {
                    case '👤 Профиль':
                        return ctx.scene.enter('profileScene');
                    case '🔍 Поиск':
                        return ctx.scene.enter('ancetScene');
                    case '❤️ Лайки':
                        return ctx.scene.enter('getLikes');
                    case '💌 Метчи':
                        return ctx.scene.enter('getMetch');
                    default:
                        const id = ctx.message.text;

                        if (!/^\d+$/.test(id)) {
                            await ctx.reply('⚠️ <b>Ошибка!</b>\nID должен содержать только цифры, без букв и символов.', { parse_mode: "HTML" });
                            return
                        }

                        try {
                            const url = process.env.URL;
                            const req = await axios.get(`${url}/users/${id}`);

                            const userData = req.data.message;

                            console.log(userData);

                            const iconsTop = getTopIcon(userData.top);
                            const formatNumberCoin = formatNumber(userData.coin);
                            const formatNumberLike = formatNumber(userData.like);
                            const formatNumberDislike = formatNumber(userData.dislike);

                            const profileMessage = `
<b>${userData.premium ? '⭐ PREMIUM ⭐' : '💘 Анкета пользователя'}</b>
${iconsTop} <b>Место в топе:</b> ${userData.top}
———————————————  
${userData.gender ? '👱🏻‍♀️' : '👱🏻'} <b>Имя:</b> ${userData.name}  
🎂 <b>Возраст:</b> ${userData.age}   
📍 <b>Город:</b> ${userData.city}  
📖 <b>Описание:</b> ${userData.description}  
🎯 <b>Возрастной диапазон:</b> ${userData.minAge} - ${userData.maxAge}
${userData.searchGender ? '👱🏻‍♀️' : '👱🏻'} <b>Пол поиска:</b> ${userData.searchGender ? 'Женский' : 'Мужской'}    
———————————————
❤️ <b>Лайков:</b> ${formatNumberLike}  
👎 <b>Дизлайков:</b> ${formatNumberDislike}  
💠 <b>Гемы:</b> ${formatNumberCoin}  
 `;
                            if (userData.role === 'admin') {
                                await ctx.reply('⚠️ <b>Ошибка!</b>\nВы не можете получить анкету этого пользователя, так как он является администратором.', { parse_mode: "HTML" });

                                return ctx.scene.leave();
                            }

                            await redis.set(`session-${ctx.from?.id}`, `${id}`);

                            const buttons = {
                                reply_markup: {
                                    inline_keyboard: userData.banned
                                        ? [
                                            [{ text: '🚫 Разбанить пользователя', callback_data: 'unban' }]
                                        ]
                                        : [
                                            [{ text: '🔒 Забанить пользователя', callback_data: 'ban' }],
                                            [{ text: '✨ Выдать премиум', callback_data: 'premium' }]
                                        ]
                                }
                            };

                            await ctx.replyWithPhoto(userData.photo || '', {
                                caption: profileMessage,
                                parse_mode: "HTML",
                                ...buttons
                            })

                            return ctx.wizard.next();
                        } catch (err) {
                            if (err instanceof Error) {
                                console.error(err.message);
                            } else {
                                console.error(err)
                            }
                            await ctx.reply(`${err instanceof Error ? err.message : 'Please, check console'}`);
                        }
                }
            }
        }
        return
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

    if ('data' in ctx.callbackQuery) {
        const message2 = ctx.callbackQuery.data;

        switch (message2) {
            case 'unban':
                return ctx.scene.enter('unbanScene')

            case 'ban':
                return ctx.scene.enter('banScene')

            case 'premium':
                return ctx.scene.enter('premiumSceneAdmin')

            default:
                break
        }
    }
})

export const advertisemenScene = new Scenes.WizardScene<MyContext>('advertisemenScene', async (ctx) => {
    await ctx.reply(
        `<b>📢 Создание объявления</b>\n\n` +
        `Введите текст, который хотите отправить пользователям. Это будет ваше объявление!`,
        {
            parse_mode: 'HTML', reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'Выйти с создания обявления',
                            callback_data: 'exit-advertisemen'
                        }
                    ]
                ]
            }
        }
    );

    return ctx.wizard.next();

}, async (ctx) => {

    if (!ctx.callbackQuery) {
        if (ctx.message !== undefined) {
            if ('text' in ctx.message) {
                const message = ctx.message?.text;

                if (ctx.session.sendMessage) {
                    const result = await editMessageFromGetAnket(ctx);

                    if (!result) {
                        console.log('Ошибка в исправлении сообщения!');
                    }
                }

                if (message.startsWith('/')) {
                    switch (message) {
                        case '/profile':
                            return ctx.scene.enter('profileScene');
                        case '/search':
                            ctx.session.sendMessage = 0
                            ctx.session.keyboard = true
                            return ctx.scene.enter('ancetScene');
                        case '/send':
                            ctx.session.exitGems = false
                            ctx.session.sendMessage = 0
                            return ctx.scene.enter('sendGems');
                        case '/likes':
                            return ctx.scene.enter('getLikes');
                        case '/metches':
                            ctx.session.sendMessage = 0;
                            ctx.session.count = 0;
                            return ctx.scene.enter('getMetch');
                        case '/reported':
                            return ctx.scene.enter('reportScene');
                        case '/nexySession':
                            ctx.reply(JSON.stringify(ctx.session));
                            return ctx.scene.leave();
                        case '/top':
                            ctx.session.sendMessage = 0
                            ctx.session.countTop = 1
                            return ctx.scene.enter('topScenes');
                        case '/shop':
                            ctx.session.exitGems = false;
                            return ctx.scene.enter("shopScene");
                        case '/case':
                            return ctx.scene.enter('caseScene');
                        case '/ref':
                            return ctx.scene.enter("referalScene");
                        case '/help':
                            await ctx.reply(
                                'Доступные команды:\n\n' +
                                '🔹 <b>/profile</b> - Перейти в профиль\n' +
                                '🔹 <b>/search</b> - Начать поиск анкет\n' +
                                '🔹 <b>/likes</b> - Просмотр ваших лайков\n' +
                                '🔹 <b>/metches</b> - Просмотр метчей\n' +
                                '🔹 <b>/top</b> - Просмотр топа юзера\n' +
                                '🔹 <b>/send</b> - Отправка гемов\n' +
                                '🔹 <b>/shop</b> - Магазин\n' +
                                '🔹 <b>/case</b> - Кейсы\n' +
                                '🔹 <b>/ref</b> - Рефералка\n' +
                                '🔹 <b>/help</b> - Список доступных команд',
                                {
                                    parse_mode: 'HTML'
                                }
                            );
                            break;
                        case '/luchaevaMuda':
                            return ctx.scene.enter('adminScene');
                        case '/reported':
                            return ctx.scene.enter('reportScene');
                        case '/exitNexy':
                            try {
                                const url = process.env.URL;

                                const getUser = await axios.get(`${url}/users/${ctx.from?.id}`);

                                const user = getUser.data.message;

                                if (user.role !== 'admin') {
                                    await ctx.reply('⛔ У вас недостаточно прав для выполнения этого действия.');
                                    return
                                }

                                await ctx.reply('Вы успешно покинули все сессии! Можете использвоать /clearNexySession или /nexySession для проверкии сессии')
                                return ctx.scene.leave();
                            } catch (err) {
                                if (err instanceof Error) {
                                    console.error(err.message);
                                } else {
                                    console.error(err);
                                }

                                await ctx.reply('Произошла ошибка при проверке статуса юзера! Перезапустите команду и попробуйте езе раз');

                            }

                        default:
                            await ctx.reply('❌ Неизвестная команда. Попробуйте /help для получения списка доступных команд.');
                            break;
                    }
                    return;
                }

                switch (message) {
                    case '👤 Профиль':
                        return ctx.scene.enter('profileScene');
                    case '🔍 Поиск':
                        ctx.session.keyboard = true
                        ctx.session.sendMessage = 0
                        return ctx.scene.enter('ancetScene');
                    case '❤️ Лайки':
                        return ctx.scene.enter('getLikes');
                    case '💌 Метчи':
                        ctx.session.count = 0;
                        ctx.session.sendMessage = 0;
                        return ctx.scene.enter('getMetch');
                    case '🥇 Топ':
                        ctx.session.sendMessage = 0
                        ctx.session.countTop = 1
                        return ctx.scene.enter('topScenes');
                    case '📦 Кейсы':
                        return ctx.scene.enter('caseScene');
                    case '🛒 Магазин':
                        ctx.session.exitGems = false;
                        return ctx.scene.enter("shopScene");
                    case '🔗 Рефералка':
                        return ctx.scene.enter("referalScene");
                    case '💠 Гемы':
                        ctx.session.exitGems = false
                        ctx.session.sendMessage = 0
                        return ctx.scene.enter('sendGems');
                    default:
                        try {
                            const url = process.env.URL;

                            const req = await axios.post(`${url}/report`, {
                                message: message
                            });

                            if (req.status === 400) {
                                throw new Error(JSON.stringify(req.data.message));
                            }

                            await ctx.reply(
                                `<b>✅ Объявление успешно создано!</b>\n\n` +
                                `Теперь оно доступно для пользователей.`,
                                { parse_mode: 'HTML' }
                            );

                            return ctx.scene.leave()
                        } catch (err) {
                            if (err instanceof Error) {
                                console.error('err:' + err.message);
                            }

                            await ctx.reply(
                                `<b>❌ Ошибка при создании объявления!</b>\n\n` +
                                `Попробуйте <b>перезапустить</b> админ-панель и повторить попытку.`,
                                { parse_mode: 'HTML' }
                            );
                        }
                        return;
                }
            }
        }
        return
    }

    if ('data' in ctx.callbackQuery) {
        if (ctx.callbackQuery.data === 'exit-advertisemen') {
            ctx.scene.enter('adminScene');
        }
    }

});

export const chanelsScene = new Scenes.WizardScene<MyContext>('chanelsScene', async (ctx) => {
    await ctx.reply(
        `📌 <b>Управление подписками</b>\n\n` +
        `В этом меню вы можете:\n` +
        `1️⃣ <b>Добавить</b> новый канал для обязательной подписки\n` +
        `2️⃣ <b>Удалить</b> канал из списка обязательных\n\n` +
        `Выберите действие ниже ⬇️`,
        {
            parse_mode: 'HTML', reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'Добавить',
                            callback_data: 'add_chanels'
                        },
                        {
                            text: 'Удалить',
                            callback_data: 'delete_chanels'
                        }
                    ]
                ]
            }
        }
    );


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

    if ('data' in ctx.callbackQuery) {
        const message = ctx.callbackQuery.data;

        switch (message) {
            case 'add_chanels':
                return ctx.scene.enter('addChanelsScene');

            case 'delete_chanels':
                return ctx.scene.enter('deleteChanelsScene');

            default:
                break
        }
    }
});

export const addChanelsScene = new Scenes.WizardScene<MyContext>('addChanelsScene', async (ctx) => {
    await ctx.reply('📢 <b>Введите ник канала</b> через @, например: <code>@example_channel</code>', {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: 'Выйти',
                        callback_data: 'exit-chanels'
                    }
                ]
            ]
        }
    });

    return ctx.wizard.next();
}, async (ctx) => {

    if (!ctx.callbackQuery) {
        if (ctx.message !== undefined) {
            if ('text' in ctx.message) {
                const message = ctx.message?.text;

                if (ctx.session.sendMessage) {
                    const result = await editMessageFromGetAnket(ctx);

                    if (!result) {
                        console.log('Ошибка в исправлении сообщения!');
                    }
                }

                if (message.startsWith('/')) {
                    switch (message) {
                        case '/profile':
                            return ctx.scene.enter('profileScene');
                        case '/search':
                            ctx.session.sendMessage = 0
                            ctx.session.keyboard = true
                            return ctx.scene.enter('ancetScene');
                        case '/send':
                            ctx.session.exitGems = false
                            ctx.session.sendMessage = 0
                            return ctx.scene.enter('sendGems');
                        case '/likes':
                            return ctx.scene.enter('getLikes');
                        case '/metches':
                            ctx.session.sendMessage = 0;
                            ctx.session.count = 0;
                            return ctx.scene.enter('getMetch');
                        case '/reported':
                            return ctx.scene.enter('reportScene');
                        case '/nexySession':
                            ctx.reply(JSON.stringify(ctx.session));
                            return ctx.scene.leave();
                        case '/top':
                            ctx.session.sendMessage = 0
                            ctx.session.countTop = 1
                            return ctx.scene.enter('topScenes');
                        case '/shop':
                            ctx.session.exitGems = false;
                            return ctx.scene.enter("shopScene");
                        case '/case':
                            return ctx.scene.enter('caseScene');
                        case '/ref':
                            return ctx.scene.enter("referalScene");
                        case '/help':
                            await ctx.reply(
                                'Доступные команды:\n\n' +
                                '🔹 <b>/profile</b> - Перейти в профиль\n' +
                                '🔹 <b>/search</b> - Начать поиск анкет\n' +
                                '🔹 <b>/likes</b> - Просмотр ваших лайков\n' +
                                '🔹 <b>/metches</b> - Просмотр метчей\n' +
                                '🔹 <b>/top</b> - Просмотр топа юзера\n' +
                                '🔹 <b>/send</b> - Отправка гемов\n' +
                                '🔹 <b>/shop</b> - Магазин\n' +
                                '🔹 <b>/case</b> - Кейсы\n' +
                                '🔹 <b>/ref</b> - Рефералка\n' +
                                '🔹 <b>/help</b> - Список доступных команд',
                                {
                                    parse_mode: 'HTML'
                                }
                            );
                            break;
                        case '/luchaevaMuda':
                            return ctx.scene.enter('adminScene');
                        case '/reported':
                            return ctx.scene.enter('reportScene');
                        case '/exitNexy':
                            try {
                                const url = process.env.URL;

                                const getUser = await axios.get(`${url}/users/${ctx.from?.id}`);

                                const user = getUser.data.message;

                                if (user.role !== 'admin') {
                                    await ctx.reply('⛔ У вас недостаточно прав для выполнения этого действия.');
                                    return
                                }

                                await ctx.reply('Вы успешно покинули все сессии! Можете использвоать /clearNexySession или /nexySession для проверкии сессии')
                                return ctx.scene.leave();
                            } catch (err) {
                                if (err instanceof Error) {
                                    console.error(err.message);
                                } else {
                                    console.error(err);
                                }

                                await ctx.reply('Произошла ошибка при проверке статуса юзера! Перезапустите команду и попробуйте езе раз');

                            }

                        default:
                            await ctx.reply('❌ Неизвестная команда. Попробуйте /help для получения списка доступных команд.');
                            break;
                    }
                    return;
                }

                switch (message) {
                    case '👤 Профиль':
                        return ctx.scene.enter('profileScene');
                    case '🔍 Поиск':
                        ctx.session.keyboard = true
                        ctx.session.sendMessage = 0
                        return ctx.scene.enter('ancetScene');
                    case '❤️ Лайки':
                        return ctx.scene.enter('getLikes');
                    case '💌 Метчи':
                        ctx.session.count = 0;
                        ctx.session.sendMessage = 0;
                        return ctx.scene.enter('getMetch');
                    case '🥇 Топ':
                        ctx.session.sendMessage = 0
                        ctx.session.countTop = 1
                        return ctx.scene.enter('topScenes');
                    case '📦 Кейсы':
                        return ctx.scene.enter('caseScene');
                    case '🛒 Магазин':
                        ctx.session.exitGems = false;
                        return ctx.scene.enter("shopScene");
                    case '🔗 Рефералка':
                        return ctx.scene.enter("referalScene");
                    case '💠 Гемы':
                        ctx.session.exitGems = false
                        ctx.session.sendMessage = 0
                        return ctx.scene.enter('sendGems');
                    default:
                        try {
                            const url = process.env.URL;
                            const req = await axios.post(`${url}/chanels`, {
                                message: message
                            });

                            if (req.status === 400) {
                                throw new Error(JSON.stringify(req.data.message));
                            }

                            await ctx.reply(
                                `✅ <b>Канал успешно добавлен</b> в список обязательных!`,
                                { parse_mode: 'HTML' }
                            );

                            return ctx.scene.enter('adminScene');
                        } catch (err) {
                            if (err instanceof Error) {
                                console.error(err.message);
                            } else {
                                console.error(err);
                            }

                            ctx.reply('Произошла ошибка при добавлении нового канала! Проверьте консоль.');
                        }
                        return;
                }

            }
        }
        return
    }

    if ('data' in ctx.callbackQuery) {
        const message = ctx.callbackQuery.data;

        switch (message) {
            case 'exit-chanels':
                await ctx.scene.enter('adminScene');
            default:
                break
        }
    }
})

export const deleteChanelsScene = new Scenes.WizardScene<MyContext>('deleteChanelsScene', async (ctx) => {
    await ctx.reply(
        '📢 <b>Введите ник канала</b> через @, который хотите удалить. Например: <code>@example_channel</code>',
        {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'Выйти',
                            callback_data: 'exit_delete_channels'
                        }
                    ]
                ]
            }
        }
    );


    return ctx.wizard.next();
}, async (ctx) => {

    if (!ctx.callbackQuery) {
        if (ctx.message !== undefined) {
            if ('text' in ctx.message) {
                const message = ctx.message?.text;

                if (ctx.session.sendMessage) {
                    const result = await editMessageFromGetAnket(ctx);

                    if (!result) {
                        console.log('Ошибка в исправлении сообщения!');
                    }
                }

                if (message.startsWith('/')) {
                    switch (message) {
                        case '/profile':
                            return ctx.scene.enter('profileScene');
                        case '/search':
                            ctx.session.sendMessage = 0
                            ctx.session.keyboard = true
                            return ctx.scene.enter('ancetScene');
                        case '/send':
                            ctx.session.exitGems = false
                            ctx.session.sendMessage = 0
                            return ctx.scene.enter('sendGems');
                        case '/likes':
                            return ctx.scene.enter('getLikes');
                        case '/metches':
                            ctx.session.sendMessage = 0;
                            ctx.session.count = 0;
                            return ctx.scene.enter('getMetch');
                        case '/reported':
                            return ctx.scene.enter('reportScene');
                        case '/nexySession':
                            ctx.reply(JSON.stringify(ctx.session));
                            return ctx.scene.leave();
                        case '/top':
                            ctx.session.sendMessage = 0
                            ctx.session.countTop = 1
                            return ctx.scene.enter('topScenes');
                        case '/shop':
                            ctx.session.exitGems = false;
                            return ctx.scene.enter("shopScene");
                        case '/case':
                            return ctx.scene.enter('caseScene');
                        case '/ref':
                            return ctx.scene.enter("referalScene");
                        case '/help':
                            await ctx.reply(
                                'Доступные команды:\n\n' +
                                '🔹 <b>/profile</b> - Перейти в профиль\n' +
                                '🔹 <b>/search</b> - Начать поиск анкет\n' +
                                '🔹 <b>/likes</b> - Просмотр ваших лайков\n' +
                                '🔹 <b>/metches</b> - Просмотр метчей\n' +
                                '🔹 <b>/top</b> - Просмотр топа юзера\n' +
                                '🔹 <b>/send</b> - Отправка гемов\n' +
                                '🔹 <b>/shop</b> - Магазин\n' +
                                '🔹 <b>/case</b> - Кейсы\n' +
                                '🔹 <b>/ref</b> - Рефералка\n' +
                                '🔹 <b>/help</b> - Список доступных команд',
                                {
                                    parse_mode: 'HTML'
                                }
                            );
                            break;
                        case '/luchaevaMuda':
                            return ctx.scene.enter('adminScene');
                        case '/reported':
                            return ctx.scene.enter('reportScene');
                        case '/exitNexy':
                            try {
                                const url = process.env.URL;

                                const getUser = await axios.get(`${url}/users/${ctx.from?.id}`);

                                const user = getUser.data.message;

                                if (user.role !== 'admin') {
                                    await ctx.reply('⛔ У вас недостаточно прав для выполнения этого действия.');
                                    return
                                }

                                await ctx.reply('Вы успешно покинули все сессии! Можете использвоать /clearNexySession или /nexySession для проверкии сессии')
                                return ctx.scene.leave();
                            } catch (err) {
                                if (err instanceof Error) {
                                    console.error(err.message);
                                } else {
                                    console.error(err);
                                }

                                await ctx.reply('Произошла ошибка при проверке статуса юзера! Перезапустите команду и попробуйте езе раз');

                            }

                        default:
                            await ctx.reply('❌ Неизвестная команда. Попробуйте /help для получения списка доступных команд.');
                            break;
                    }
                    return;
                }

                switch (message) {
                    case '👤 Профиль':
                        return ctx.scene.enter('profileScene');
                    case '🔍 Поиск':
                        ctx.session.keyboard = true
                        ctx.session.sendMessage = 0
                        return ctx.scene.enter('ancetScene');
                    case '❤️ Лайки':
                        return ctx.scene.enter('getLikes');
                    case '💌 Метчи':
                        ctx.session.count = 0;
                        ctx.session.sendMessage = 0;
                        return ctx.scene.enter('getMetch');
                    case '🥇 Топ':
                        ctx.session.sendMessage = 0
                        ctx.session.countTop = 1
                        return ctx.scene.enter('topScenes');
                    case '📦 Кейсы':
                        return ctx.scene.enter('caseScene');
                    case '🛒 Магазин':
                        ctx.session.exitGems = false;
                        return ctx.scene.enter("shopScene");
                    case '🔗 Рефералка':
                        return ctx.scene.enter("referalScene");
                    case '💠 Гемы':
                        ctx.session.exitGems = false
                        ctx.session.sendMessage = 0
                        return ctx.scene.enter('sendGems');
                    default:
                        try {
                            const url = process.env.URL;
                            const req = await axios.delete(`${url}/chanels/${message}`,);

                            if (req.status === 400) {
                                throw new Error(JSON.stringify(req.data.message));
                            }

                            await ctx.reply(
                                `✅ <b>Канал успешно удален</b> из списка обязательных!`,
                                { parse_mode: 'HTML' }
                            );

                            return ctx.scene.enter('adminScene');
                        } catch (err) {
                            if (err instanceof Error) {
                                console.error(err.message);
                            } else {
                                console.error(err);
                            }

                            ctx.reply('Произошла ошибка при добавлении нового канала! Проверьте консоль.');
                        }
                        return;
                }

            }
        }
        return
    }

    if ('data' in ctx.callbackQuery) {
        const message = ctx.callbackQuery.data;

        switch (message) {
            case 'exit-chanels':
                await ctx.scene.enter('adminScene');
            default:
                break
        }
    }
});

export const advertisementInSearch = new Scenes.WizardScene<MyContext>('advertisementInSearch', async (ctx) => {
    await ctx.reply(
        `📌 <b>Создание рекламы для ленты</b>\n\n` +
        `В этом меню вы можете:\n` +
        `1️⃣ <b>Создать</b> новую рекламную кампанию, которая будет показываться в ленте пользователей\n` +
        `2️⃣ <b>Просмотреть</b> список активных рекламных кампаний\n` +
        `3️⃣ <b>Удалить</b> уже существующую рекламную кампанию\n\n` +
        `Выберите действие ниже ⬇️`,
        {
            parse_mode: 'HTML', reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'Создать рекламу',
                            callback_data: 'create_advertisement'
                        }
                    ],
                    [
                        {
                            text: 'Список',
                            callback_data: 'get_advertisement'
                        }
                    ],
                    [
                        {
                            text: 'Удалить рекламу',
                            callback_data: 'delete_advertisement'
                        }
                    ]
                ]
            }
        }
    );

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

    if ('data' in ctx.callbackQuery) {
        const message = ctx.callbackQuery.data;

        switch (message) {
            case 'create_advertisement':
                return ctx.scene.enter('createAdvertisementScenes');

            case 'get_advertisement':
                return ctx.scene.enter('getAdvertisementScenes');

            case 'delete_advertisement':
                return ctx.scene.enter('deleteAdvertisementScenes');

            default:
                await ctx.reply(
                    '⚠️ <b>Ты нажал что-то не то!</b> Попробуй ещё раз. 🔄',
                    { parse_mode: 'HTML' }
                );
                break
        }
    }

});

export const createAdvertisementScenes = new Scenes.WizardScene<MyContext>('createAdvertisementScenes', async (ctx) => {
    ctx.session.createAdvertisement = {
        text: '',
        photo: '',
        link: '',
        day: 0,
    }

    await ctx.reply('Введите текст, который будет использоваться внутри рекламы. Необходимо преобразовать текст в HTML-подобный. Сделать это может сделать - https://chatgpt.com', {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: 'Выйти',
                        callback_data: 'cancel'
                    }
                ]
            ]
        }
    });

    return ctx.wizard.next();
}, async (ctx) => {
    if (!ctx.callbackQuery) {
        if (ctx.message !== undefined) {
            if ('text' in ctx.message) {
                const message = ctx.message?.text;

                const checkSubscription = await checkSubscriptionMiddleware(ctx)

                if (!checkSubscription) {
                    return;
                }

                if (ctx.session.sendMessage) {
                    const result = await editMessageFromGetAnket(ctx);

                    if (!result) {
                        console.log('Ошибка в исправлении сообщения!');
                    }
                }

                if (message.startsWith('/')) {
                    switch (message) {
                        case '/profile':
                            return ctx.scene.enter('profileScene');
                        case '/search':
                            ctx.session.sendMessage = 0
                            ctx.session.keyboard = true
                            return ctx.scene.enter('ancetScene');
                        case '/send':
                            ctx.session.exitGems = false
                            ctx.session.sendMessage = 0
                            return ctx.scene.enter('sendGems');
                        case '/likes':
                            return ctx.scene.enter('getLikes');
                        case '/metches':
                            ctx.session.sendMessage = 0;
                            ctx.session.count = 0;
                            return ctx.scene.enter('getMetch');
                        case '/reported':
                            return ctx.scene.enter('reportScene');
                        case '/nexySession':
                            ctx.reply(JSON.stringify(ctx.session));
                            return ctx.scene.leave();
                        case '/top':
                            ctx.session.sendMessage = 0
                            ctx.session.countTop = 1
                            return ctx.scene.enter('topScenes');
                        case '/shop':
                            ctx.session.exitGems = false;
                            return ctx.scene.enter("shopScene");
                        case '/case':
                            return ctx.scene.enter('caseScene');
                        case '/ref':
                            return ctx.scene.enter("referalScene");
                        case '/help':
                            await ctx.reply(
                                'Доступные команды:\n\n' +
                                '🔹 <b>/profile</b> - Перейти в профиль\n' +
                                '🔹 <b>/search</b> - Начать поиск анкет\n' +
                                '🔹 <b>/likes</b> - Просмотр ваших лайков\n' +
                                '🔹 <b>/metches</b> - Просмотр метчей\n' +
                                '🔹 <b>/top</b> - Просмотр топа юзера\n' +
                                '🔹 <b>/send</b> - Отправка гемов\n' +
                                '🔹 <b>/shop</b> - Магазин\n' +
                                '🔹 <b>/case</b> - Кейсы\n' +
                                '🔹 <b>/ref</b> - Рефералка\n' +
                                '🔹 <b>/help</b> - Список доступных команд',
                                {
                                    parse_mode: 'HTML'
                                }
                            );
                            break;
                        case '/luchaevaMuda':
                            return ctx.scene.enter('adminScene');
                        case '/reported':
                            return ctx.scene.enter('reportScene');
                        case '/exitNexy':
                            try {
                                const url = process.env.URL;

                                const getUser = await axios.get(`${url}/users/${ctx.from?.id}`);

                                const user = getUser.data.message;

                                if (user.role !== 'admin') {
                                    await ctx.reply('⛔ У вас недостаточно прав для выполнения этого действия.');
                                    return
                                }

                                await ctx.reply('Вы успешно покинули все сессии! Можете использвоать /clearNexySession или /nexySession для проверкии сессии')
                                return ctx.scene.leave();
                            } catch (err) {
                                if (err instanceof Error) {
                                    console.error(err.message);
                                } else {
                                    console.error(err);
                                }

                                await ctx.reply('Произошла ошибка при проверке статуса юзера! Перезапустите команду и попробуйте езе раз');

                            }

                        default:
                            await ctx.reply('❌ Неизвестная команда. Попробуйте /help для получения списка доступных команд.');
                            break;
                    }
                    return;
                }

                switch (message) {
                    case '👤 Профиль':
                        return ctx.scene.enter('profileScene');
                    case '🔍 Поиск':
                        ctx.session.keyboard = true
                        ctx.session.sendMessage = 0
                        return ctx.scene.enter('ancetScene');
                    case '❤️ Лайки':
                        return ctx.scene.enter('getLikes');
                    case '💌 Метчи':
                        ctx.session.count = 0;
                        ctx.session.sendMessage = 0;
                        return ctx.scene.enter('getMetch');
                    case '🥇 Топ':
                        ctx.session.sendMessage = 0
                        ctx.session.countTop = 1
                        return ctx.scene.enter('topScenes');
                    case '📦 Кейсы':
                        return ctx.scene.enter('caseScene');
                    case '🛒 Магазин':
                        ctx.session.exitGems = false;
                        return ctx.scene.enter("shopScene");
                    case '🔗 Рефералка':
                        return ctx.scene.enter("referalScene");
                    case '💠 Гемы':
                        ctx.session.exitGems = false
                        ctx.session.sendMessage = 0
                        return ctx.scene.enter('sendGems');
                    default:
                        try {
                            console.log('message', message);
                            ctx.session.createAdvertisement.text = message;
                            await ctx.reply('Текст успешно сохранен! Теперь скиньте ссылку на тгк или сайт. Ссылка на тгк должна иметь вид: https://t.me/@your_chanels');

                            return ctx.wizard.next();
                        } catch (err) {
                            console.error(err);
                            await ctx.reply('Возникла ошибка! Попоробуй еще раз или проверь консоль');
                        }
                }
            }
        }
        return
    }

    if ('data' in ctx.callbackQuery) {
        const message = ctx.callbackQuery.data;

        switch (message) {
            case 'cancel':
                return ctx.scene.enter('adminScene');
            default:
                await ctx.reply(
                    '⚠️ <b>Ты нажал что-то не то!</b> Попробуй ещё раз. 🔄',
                    { parse_mode: 'HTML' }
                );
                break
        }
    }
}, async (ctx) => {
    if (!ctx.callbackQuery) {
        if (ctx.message !== undefined) {
            if ('text' in ctx.message) {
                const message = ctx.message?.text;

                const checkSubscription = await checkSubscriptionMiddleware(ctx)

                if (ctx.session.sendMessage) {
                    const result = await editMessageFromGetAnket(ctx);

                    if (!result) {
                        console.log('Ошибка в исправлении сообщения!');
                    }
                }

                if (!checkSubscription) {
                    return;
                }

                if (message.startsWith('/')) {
                    switch (message) {
                        case '/profile':
                            return ctx.scene.enter('profileScene');
                        case '/search':
                            ctx.session.sendMessage = 0
                            ctx.session.keyboard = true
                            return ctx.scene.enter('ancetScene');
                        case '/send':
                            ctx.session.exitGems = false
                            ctx.session.sendMessage = 0
                            return ctx.scene.enter('sendGems');
                        case '/likes':
                            return ctx.scene.enter('getLikes');
                        case '/metches':
                            ctx.session.sendMessage = 0;
                            ctx.session.count = 0;
                            return ctx.scene.enter('getMetch');
                        case '/reported':
                            return ctx.scene.enter('reportScene');
                        case '/nexySession':
                            ctx.reply(JSON.stringify(ctx.session));
                            return ctx.scene.leave();
                        case '/top':
                            ctx.session.sendMessage = 0
                            ctx.session.countTop = 1
                            return ctx.scene.enter('topScenes');
                        case '/shop':
                            ctx.session.exitGems = false;
                            return ctx.scene.enter("shopScene");
                        case '/case':
                            return ctx.scene.enter('caseScene');
                        case '/ref':
                            return ctx.scene.enter("referalScene");
                        case '/help':
                            await ctx.reply(
                                'Доступные команды:\n\n' +
                                '🔹 <b>/profile</b> - Перейти в профиль\n' +
                                '🔹 <b>/search</b> - Начать поиск анкет\n' +
                                '🔹 <b>/likes</b> - Просмотр ваших лайков\n' +
                                '🔹 <b>/metches</b> - Просмотр метчей\n' +
                                '🔹 <b>/top</b> - Просмотр топа юзера\n' +
                                '🔹 <b>/send</b> - Отправка гемов\n' +
                                '🔹 <b>/shop</b> - Магазин\n' +
                                '🔹 <b>/case</b> - Кейсы\n' +
                                '🔹 <b>/ref</b> - Рефералка\n' +
                                '🔹 <b>/help</b> - Список доступных команд',
                                {
                                    parse_mode: 'HTML'
                                }
                            );
                            break;
                        case '/luchaevaMuda':
                            return ctx.scene.enter('adminScene');
                        case '/reported':
                            return ctx.scene.enter('reportScene');
                        case '/exitNexy':
                            try {
                                const url = process.env.URL;

                                const getUser = await axios.get(`${url}/users/${ctx.from?.id}`);

                                const user = getUser.data.message;

                                if (user.role !== 'admin') {
                                    await ctx.reply('⛔ У вас недостаточно прав для выполнения этого действия.');
                                    return
                                }

                                await ctx.reply('Вы успешно покинули все сессии! Можете использвоать /clearNexySession или /nexySession для проверкии сессии')
                                return ctx.scene.leave();
                            } catch (err) {
                                if (err instanceof Error) {
                                    console.error(err.message);
                                } else {
                                    console.error(err);
                                }

                                await ctx.reply('Произошла ошибка при проверке статуса юзера! Перезапустите команду и попробуйте езе раз');

                            }

                        default:
                            await ctx.reply('❌ Неизвестная команда. Попробуйте /help для получения списка доступных команд.');
                            break;
                    }
                    return;
                }

                switch (message) {
                    case '👤 Профиль':
                        return ctx.scene.enter('profileScene');
                    case '🔍 Поиск':
                        ctx.session.keyboard = true
                        ctx.session.sendMessage = 0
                        return ctx.scene.enter('ancetScene');
                    case '❤️ Лайки':
                        return ctx.scene.enter('getLikes');
                    case '💌 Метчи':
                        ctx.session.count = 0;
                        ctx.session.sendMessage = 0;
                        return ctx.scene.enter('getMetch');
                    case '🥇 Топ':
                        ctx.session.sendMessage = 0
                        ctx.session.countTop = 1
                        return ctx.scene.enter('topScenes');
                    case '📦 Кейсы':
                        return ctx.scene.enter('caseScene');
                    case '🛒 Магазин':
                        ctx.session.exitGems = false;
                        return ctx.scene.enter("shopScene");
                    case '🔗 Рефералка':
                        return ctx.scene.enter("referalScene");
                    case '💠 Гемы':
                        ctx.session.exitGems = false
                        ctx.session.sendMessage = 0
                        return ctx.scene.enter('sendGems');
                    default:
                        try {
                            if (!isValidURL(message)) {
                                await ctx.reply('Введённый текст не является корректной ссылкой. Пожалуйста, введите ссылку, начинающуюся с http:// или https://.');
                                return
                            }

                            ctx.session.createAdvertisement.link = message;
                            await ctx.reply('Ссылка успешно сохранена! Теперь введите количество дней, в течение которых будет отображаться реклама.');

                            return ctx.wizard.next();
                        } catch (err) {
                            console.error(err);
                            await ctx.reply('Возникла ошибка! Попоробуй еще раз или проверь консоль');
                        }
                }
            }
        }
        return
    }
}, async (ctx) => {
    if (!ctx.callbackQuery) {
        if (ctx.message !== undefined) {
            if ('text' in ctx.message) {
                const message = ctx.message?.text;

                const checkSubscription = await checkSubscriptionMiddleware(ctx)

                if (!checkSubscription) {
                    return;
                }

                if (ctx.session.sendMessage) {
                    const result = await editMessageFromGetAnket(ctx);

                    if (!result) {
                        console.log('Ошибка в исправлении сообщения!');
                    }
                }

                if (message.startsWith('/')) {
                    switch (message) {
                        case '/profile':
                            return ctx.scene.enter('profileScene');
                        case '/search':
                            ctx.session.sendMessage = 0
                            ctx.session.keyboard = true
                            return ctx.scene.enter('ancetScene');
                        case '/send':
                            ctx.session.exitGems = false
                            ctx.session.sendMessage = 0
                            return ctx.scene.enter('sendGems');
                        case '/likes':
                            return ctx.scene.enter('getLikes');
                        case '/metches':
                            ctx.session.sendMessage = 0;
                            ctx.session.count = 0;
                            return ctx.scene.enter('getMetch');
                        case '/reported':
                            return ctx.scene.enter('reportScene');
                        case '/nexySession':
                            ctx.reply(JSON.stringify(ctx.session));
                            return ctx.scene.leave();
                        case '/top':
                            ctx.session.sendMessage = 0
                            ctx.session.countTop = 1
                            return ctx.scene.enter('topScenes');
                        case '/shop':
                            ctx.session.exitGems = false;
                            return ctx.scene.enter("shopScene");
                        case '/case':
                            return ctx.scene.enter('caseScene');
                        case '/ref':
                            return ctx.scene.enter("referalScene");
                        case '/help':
                            await ctx.reply(
                                'Доступные команды:\n\n' +
                                '🔹 <b>/profile</b> - Перейти в профиль\n' +
                                '🔹 <b>/search</b> - Начать поиск анкет\n' +
                                '🔹 <b>/likes</b> - Просмотр ваших лайков\n' +
                                '🔹 <b>/metches</b> - Просмотр метчей\n' +
                                '🔹 <b>/top</b> - Просмотр топа юзера\n' +
                                '🔹 <b>/send</b> - Отправка гемов\n' +
                                '🔹 <b>/shop</b> - Магазин\n' +
                                '🔹 <b>/case</b> - Кейсы\n' +
                                '🔹 <b>/ref</b> - Рефералка\n' +
                                '🔹 <b>/help</b> - Список доступных команд',
                                {
                                    parse_mode: 'HTML'
                                }
                            );
                            break;
                        case '/luchaevaMuda':
                            return ctx.scene.enter('adminScene');
                        case '/reported':
                            return ctx.scene.enter('reportScene');
                        case '/exitNexy':
                            try {
                                const url = process.env.URL;

                                const getUser = await axios.get(`${url}/users/${ctx.from?.id}`);

                                const user = getUser.data.message;

                                if (user.role !== 'admin') {
                                    await ctx.reply('⛔ У вас недостаточно прав для выполнения этого действия.');
                                    return
                                }

                                await ctx.reply('Вы успешно покинули все сессии! Можете использвоать /clearNexySession или /nexySession для проверкии сессии')
                                return ctx.scene.leave();
                            } catch (err) {
                                if (err instanceof Error) {
                                    console.error(err.message);
                                } else {
                                    console.error(err);
                                }

                                await ctx.reply('Произошла ошибка при проверке статуса юзера! Перезапустите команду и попробуйте езе раз');

                            }

                        default:
                            await ctx.reply('❌ Неизвестная команда. Попробуйте /help для получения списка доступных команд.');
                            break;
                    }
                    return;
                }

                switch (message) {
                    case '👤 Профиль':
                        return ctx.scene.enter('profileScene');
                    case '🔍 Поиск':
                        ctx.session.keyboard = true
                        ctx.session.sendMessage = 0
                        return ctx.scene.enter('ancetScene');
                    case '❤️ Лайки':
                        return ctx.scene.enter('getLikes');
                    case '💌 Метчи':
                        ctx.session.count = 0;
                        ctx.session.sendMessage = 0;
                        return ctx.scene.enter('getMetch');
                    case '🥇 Топ':
                        ctx.session.sendMessage = 0
                        ctx.session.countTop = 1
                        return ctx.scene.enter('topScenes');
                    case '📦 Кейсы':
                        return ctx.scene.enter('caseScene');
                    case '🛒 Магазин':
                        ctx.session.exitGems = false;
                        return ctx.scene.enter("shopScene");
                    case '🔗 Рефералка':
                        return ctx.scene.enter("referalScene");
                    case '💠 Гемы':
                        ctx.session.exitGems = false
                        ctx.session.sendMessage = 0
                        return ctx.scene.enter('sendGems');
                    default:
                        try {
                            if (!(/^\d{1,2}$/.test(message) && Number(message) >= 0 && Number(message) <= 99)) {
                                await ctx.reply('Вы должны ввести число! Попробуйте еще раз');
                                return
                            }

                            ctx.session.createAdvertisement.day = message;
                            await ctx.reply('Дни успешно сохранены! Теперь скинь фотографию, которую необходимо применить в рекламе', {
                                reply_markup: {
                                    inline_keyboard: [
                                        [
                                            {
                                                text: 'Пропустить',
                                                callback_data: 'cancel-photo'
                                            }
                                        ]
                                    ]
                                }
                            });

                            return ctx.wizard.next();
                        } catch (err) {
                            console.error(err);
                            await ctx.reply('Возникла ошибка! Попоробуй еще раз или проверь консоль');
                        }
                }
            }
        }
        return
    }
}, async (ctx) => {
    if (!ctx.callbackQuery) {
        if (ctx.message !== undefined) {
            if ('text' in ctx.message) {
                await handleCommand1(ctx);
            } else if ("photo" in ctx.message) {
                const photo = ctx.message?.photo as PhotoSize[];

                console.log(photo[0].file_id);
                const fileId = photo[0].file_id

                ctx.session.createAdvertisement.photo = fileId;
                const text123 = ctx.session.createAdvertisement.text + `\n\n Ссылка: ${ctx.session.createAdvertisement.link}`;
                const text = formatText(text123);

                await ctx.reply('Успешное сохранение фото!');
                ctx.replyWithPhoto(ctx.session.createAdvertisement.photo || '', {
                    caption: text,
                    parse_mode: "HTML",
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: 'Сохранить',
                                    callback_data: 'save_advertisement'
                                }
                            ],
                            [
                                {
                                    text: 'Заполнить заново',
                                    callback_data: 'again_advertisement'
                                }
                            ]
                        ]
                    }
                })

                return ctx.wizard.next();
            }

        }

        return
    }

    if ('data' in ctx.callbackQuery) {
        const message = ctx.callbackQuery.data;

        switch (message) {
            case 'cancel-photo':
                ctx.session.createAdvertisement.photo = '';

                const text123 = ctx.session.createAdvertisement.text + `\n\n Ссылка: ${ctx.session.createAdvertisement.link} \n\n Дни: ${ctx.session.createAdvertisement.day}`;
                const text = formatText(text123);

                await ctx.reply(text, {
                    parse_mode: "HTML",
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: 'Сохранить',
                                    callback_data: 'save_advertisement'
                                }
                            ],
                            [
                                {
                                    text: 'Заполнить заново',
                                    callback_data: 'again_advertisement'
                                }
                            ]
                        ]
                    }
                })

                return ctx.wizard.next();
            default:
                await ctx.reply(
                    '⚠️ <b>Ты нажал что-то не то!</b> Попробуй ещё раз. 🔄',
                    { parse_mode: 'HTML' }
                );
                break
        }
    }
    return

}, async (ctx) => {
    if (!ctx.callbackQuery) {
        if (ctx.message !== undefined) {
            if ('text' in ctx.message) {
                await handleCommand1(ctx);
            }
        }
        return
    }

    if ('data' in ctx.callbackQuery) {
        const message = ctx.callbackQuery.data;

        switch (message) {
            case 'save_advertisement':
                try {
                    const url = process.env.URL;
                    const req = await axios.post(`${url}/advertisement`, {
                        text: ctx.session.createAdvertisement.text,
                        photo: ctx.session.createAdvertisement.photo,
                        link: ctx.session.createAdvertisement.link,
                        day: ctx.session.createAdvertisement.day
                    });

                    if (req.status === 400) {
                        throw new Error(JSON.stringify(req.data.message));
                    }

                    await ctx.reply(`Успешное сохранение рекламы! Айди рекламы: ${req.data.message.id}`);

                    ctx.session.createAdvertisement = {};

                    return ctx.scene.enter('adminScene');
                } catch (err) {
                    if (err instanceof Error) {
                        console.error(err.message)
                    } else {
                        console.error(err)
                    }

                    await ctx.reply('Ошибка в сохранении данных на сервере. Проверьте консоль для более подробной информации.');
                }

            case 'again_advertisement':
                ctx.session.createAdvertisement = {};

                return ctx.scene.enter('createAdvertisementScenes');

            default:
                await ctx.reply(
                    '⚠️ <b>Ты нажал что-то не то!</b> Попробуй ещё раз. 🔄',
                    { parse_mode: 'HTML' }
                );
                break
        }
    }
}
);

export const deleteAdvertisementScenes = new Scenes.WizardScene<MyContext>('deleteAdvertisementScenes', async (ctx) => {
    await ctx.reply('🗑️ <b>Удаление рекламы</b>\n\n' +
        'Введите <b>ID</b> рекламы, которую хотите удалить. ID должен быть числом.',
        {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'Выйти',
                            callback_data: 'cancel'
                        }
                    ]
                ]
            }
        }
    );

    return ctx.wizard.next();
}, async (ctx) => {
    if (!ctx.callbackQuery) {
        if (ctx.message !== undefined) {
            if ('text' in ctx.message) {
                const message = ctx.message?.text;

                const checkSubscription = await checkSubscriptionMiddleware(ctx)

                if (!checkSubscription) {
                    return;
                }

                if (ctx.session.sendMessage) {
                    const result = await editMessageFromGetAnket(ctx);

                    if (!result) {
                        console.log('Ошибка в исправлении сообщения!');
                    }
                }

                if (message.startsWith('/')) {
                    switch (message) {
                        case '/profile':
                            return ctx.scene.enter('profileScene');
                        case '/search':
                            ctx.session.sendMessage = 0
                            ctx.session.keyboard = true
                            return ctx.scene.enter('ancetScene');
                        case '/send':
                            ctx.session.exitGems = false
                            ctx.session.sendMessage = 0
                            return ctx.scene.enter('sendGems');
                        case '/likes':
                            return ctx.scene.enter('getLikes');
                        case '/metches':
                            ctx.session.sendMessage = 0;
                            ctx.session.count = 0;
                            return ctx.scene.enter('getMetch');
                        case '/reported':
                            return ctx.scene.enter('reportScene');
                        case '/nexySession':
                            ctx.reply(JSON.stringify(ctx.session));
                            return ctx.scene.leave();
                        case '/top':
                            ctx.session.sendMessage = 0
                            ctx.session.countTop = 1
                            return ctx.scene.enter('topScenes');
                        case '/shop':
                            ctx.session.exitGems = false;
                            return ctx.scene.enter("shopScene");
                        case '/case':
                            return ctx.scene.enter('caseScene');
                        case '/ref':
                            return ctx.scene.enter("referalScene");
                        case '/help':
                            await ctx.reply(
                                'Доступные команды:\n\n' +
                                '🔹 <b>/profile</b> - Перейти в профиль\n' +
                                '🔹 <b>/search</b> - Начать поиск анкет\n' +
                                '🔹 <b>/likes</b> - Просмотр ваших лайков\n' +
                                '🔹 <b>/metches</b> - Просмотр метчей\n' +
                                '🔹 <b>/top</b> - Просмотр топа юзера\n' +
                                '🔹 <b>/send</b> - Отправка гемов\n' +
                                '🔹 <b>/shop</b> - Магазин\n' +
                                '🔹 <b>/case</b> - Кейсы\n' +
                                '🔹 <b>/ref</b> - Рефералка\n' +
                                '🔹 <b>/help</b> - Список доступных команд',
                                {
                                    parse_mode: 'HTML'
                                }
                            );
                            break;
                        case '/luchaevaMuda':
                            return ctx.scene.enter('adminScene');
                        case '/reported':
                            return ctx.scene.enter('reportScene');
                        case '/exitNexy':
                            try {
                                const url = process.env.URL;

                                const getUser = await axios.get(`${url}/users/${ctx.from?.id}`);

                                const user = getUser.data.message;

                                if (user.role !== 'admin') {
                                    await ctx.reply('⛔ У вас недостаточно прав для выполнения этого действия.');
                                    return
                                }

                                await ctx.reply('Вы успешно покинули все сессии! Можете использвоать /clearNexySession или /nexySession для проверкии сессии')
                                return ctx.scene.leave();
                            } catch (err) {
                                if (err instanceof Error) {
                                    console.error(err.message);
                                } else {
                                    console.error(err);
                                }

                                await ctx.reply('Произошла ошибка при проверке статуса юзера! Перезапустите команду и попробуйте езе раз');

                            }

                        default:
                            await ctx.reply('❌ Неизвестная команда. Попробуйте /help для получения списка доступных команд.');
                            break;
                    }
                    return;
                }

                switch (message) {
                    case '👤 Профиль':
                        return ctx.scene.enter('profileScene');
                    case '🔍 Поиск':
                        ctx.session.keyboard = true
                        ctx.session.sendMessage = 0
                        return ctx.scene.enter('ancetScene');
                    case '❤️ Лайки':
                        return ctx.scene.enter('getLikes');
                    case '💌 Метчи':
                        ctx.session.count = 0;
                        ctx.session.sendMessage = 0;
                        return ctx.scene.enter('getMetch');
                    case '🥇 Топ':
                        ctx.session.sendMessage = 0
                        ctx.session.countTop = 1
                        return ctx.scene.enter('topScenes');
                    case '📦 Кейсы':
                        return ctx.scene.enter('caseScene');
                    case '🛒 Магазин':
                        ctx.session.exitGems = false;
                        return ctx.scene.enter("shopScene");
                    case '🔗 Рефералка':
                        return ctx.scene.enter("referalScene");
                    case '💠 Гемы':
                        ctx.session.exitGems = false
                        ctx.session.sendMessage = 0
                        return ctx.scene.enter('sendGems');
                    default:
                        if (!(/^\d+$/.test(message) && Number(message))) {
                            await ctx.reply('Вам необходимо ввести число!');
                            return
                        }

                        try {
                            const url = process.env.URL;
                            const req = await axios.delete(`${url}/advertisement/${message}`, {
                                validateStatus: () => true
                            });

                            if (req.status === 400) {
                                throw new Error(req.data ? JSON.stringify(req.data) : 'Неизвестная ошибка');
                            }

                            await ctx.reply('Успешное удаление рекламы из ленты!');

                            return ctx.scene.enter('adminScene')
                        } catch (err) {
                            if (err instanceof Error) {
                                console.error('err:', err.message);
                            } else {
                                console.error(err);
                            }

                            await ctx.reply('Произошла ошибка! Попробуйте еще раз или посмотрите консоль для подробного получения информации', {
                                reply_markup: {
                                    inline_keyboard: [
                                        [
                                            {
                                                text: 'Выйти',
                                                callback_data: 'cancel'
                                            }
                                        ]
                                    ]
                                }
                            })
                        }

                        return;
                }
            }
        }
        return
    }

    if ('data' in ctx.callbackQuery) {
        const message = ctx.callbackQuery.data;

        switch (message) {
            case 'cancel':
                return ctx.scene.enter('adminScene');
            default:
                await ctx.reply(
                    '⚠️ <b>Ты нажал что-то не то!</b> Попробуй ещё раз. 🔄',
                    { parse_mode: 'HTML' }
                );
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

    if ('data' in ctx.callbackQuery) {
        const message = ctx.callbackQuery.data;

        switch (message) {
            case 'cancel':
                return ctx.scene.enter('adminScene');
            default:
                await ctx.reply(
                    '⚠️ <b>Ты нажал что-то не то!</b> Попробуй ещё раз. 🔄',
                    { parse_mode: 'HTML' }
                );
                break
        }
    }
});

export const getAdvertisementScenes = new Scenes.WizardScene<MyContext>('getAdvertisementScenes', async (ctx) => {
    try {
        const url = process.env.URL;

        const req = await axios.get(`${url}/advertisement/`, {
            validateStatus: () => true
        });

        if (req.status === 400) {
            throw new Error(JSON.stringify(req.data.message));
        }

        const formattedText = req.data.message
            .map((ad: any) => `📌 <b>${ad.id}</b> — ${ad.text.replace(/<\/?[^>]+(>|$)/g, "").substring(0, 30)}...`)
            .join("\n");

        await ctx.reply(`<b>📢 Доступная реклама в ленте поиска:</b>\n\n${formattedText}`, {
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'Выйти',
                            callback_data: 'cancel'
                        }
                    ]
                ]
            }
        });


    } catch (err) {
        if (err instanceof Error) {
            console.error('err:', err.message);
        } else {
            console.error(err);
        }

        await ctx.reply('Произошла ошибка! Попробуйте еще раз или посмотрите консоль для подробного получения информации', {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'Выйти',
                            callback_data: 'cancel'
                        }
                    ]
                ]
            }
        });
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

    if ('data' in ctx.callbackQuery) {
        const message = ctx.callbackQuery.data;

        switch (message) {
            case 'cancel':
                return ctx.scene.enter('adminScene');
            default:
                await ctx.reply(
                    '⚠️ <b>Ты нажал что-то не то!</b> Попробуй ещё раз. 🔄',
                    { parse_mode: 'HTML' }
                );
                break
        }
    }
});

function isValidURL(text: string): boolean {
    const urlRegex = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,6}(\/[^\s]*)?$/i;
    return urlRegex.test(text);
}