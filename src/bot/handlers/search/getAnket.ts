import axios from 'axios';
import { MyContext } from './../../interfaces/state';
import { Scenes } from "telegraf";
import { redis } from '../../index';
import { handleCommand1, formatNumber, getTopIcon } from '../commands/handle';
import { checkSubscriptionMiddleware } from '../../index';
import { formatText } from '../commands/handle';
import { buttonNavProfile } from '../../keyboards/Interaction';

const testFucntion = async (ctx: MyContext) => {
    try {
        const url = process.env.URL;
        const manyAncket = await redis.llen(`user-search-${ctx.from?.id}`);

        console.log(manyAncket)

        if (Number(manyAncket) !== 0) {
            return true
        }

        const req = await axios.get(`${url}/match/${ctx.from?.id}`);

        if (req.status === 400) {
            throw new Error(JSON.stringify(req.data.message));
        }

        console.log(req.data)
        console.log()

        if (!req.data.message || req.data.message.length === 0) {
            throw new Error('Нет данных от сервера');
        } else if (req.data.status === 201) {
            await ctx.reply(
                `<b>🔍 Нет подходящих анкет!</b>\n\n` +
                `Попробуйте <b>изменить настройки поиска</b> или зайдите позже — возможно, появятся новые пользователи.`,
                { parse_mode: 'HTML' }
            );
            return ctx.scene.leave();
        }

        await redis.del(`user-search-${ctx.from?.id}`);

        await redis.rpush(`user-search-${ctx.from?.id}`, ...req.data.message);
        return true
    } catch (err) {
        if (err instanceof Error) {
            console.error(err.message);
        }
        await ctx.reply(`${err instanceof Error ? err.message : 'Please, check console'}`);
        return false
    }
}

// const editMessage = async (ctx: MyContext) => {

//     const profile = await redis.hgetall(`anket-${ctx.from?.id}`);

//     const iconsTop = getTopIcon(Number(profile.top));
//     const formatNumberCoin = formatNumber(Number(profile.coin));
//     const formatNumberLike = formatNumber(Number(profile.like));
//     const formatNumberDislike = formatNumber(Number(profile.dislike));

//     const newProfileMessage = `  
// <b>${profile.premium ? '⭐ PREMIUM ⭐' : '💘 Анкета пользователя'}</b>
// ${iconsTop} <b>Место в топе:</b> ${profile.top}
// ———————————————  
// 👤 <b>Имя:</b> ${profile.name}  
// 🎂 <b>Возраст:</b> ${profile.age}  
// 📍 <b>Город:</b> ${profile.city}  
// 📖 <b>Описание:</b> ${profile.description}  
// ———————————————  
// ❤️ <b>Лайков:</b> ${formatNumberLike}  
// 👎 <b>Дизлайков:</b> ${formatNumberDislike}  
// 💠 <b>Гемы:</b> ${formatNumberCoin}  
// `;

//     if (ctx.chat === undefined) {
//         return false
//     }

//     await ctx.telegram.editMessageCaption(
//         ctx.chat.id,
//         ctx.session.sendMessage,
//         undefined,
//         newProfileMessage,
//         {
//             parse_mode: "HTML"
//         }
//     );

//     return true;
// }

export const editMessage = async (ctx: any) => {
    try {
        await ctx.telegram.editMessageReplyMarkup(
            ctx.chat.id,
            ctx.session.sendMessage,
            undefined,
            null
        );
        return true
    } catch (err) {
        console.error(err);

        return false
    }
}

export const editMessageMorGems = async (ctx: any, text: string, markup: any) => {
    try {
        await ctx.telegram.editMessageCaption(
            ctx.chat.id,
            ctx.session.sendMessage,
            undefined,
            text,
            {
                parse_mode: "HTML",
                ...markup
            }
        );
        return true
    } catch (err) {
        console.error(err);
        return false
    }
}

export const editMessageOnlyText = async (ctx: any, text: string, markup: any) => {
    try {
        await ctx.telegram.editMessageText(
            ctx.chat.id,
            ctx.session.sendMessage,
            undefined,
            text,
            {
                parse_mode: "HTML",
                ...markup
            }
        );
        return true
    } catch (err) {
        console.error(err);
        return false
    }
}

export const ancetScene = new Scenes.WizardScene<MyContext>('ancetScene', async (ctx) => {
    try {
        const banned = await redis.get(`ban-${ctx.from?.id}`);

        if (banned === 'true') {
            await ctx.reply('Вы не можете пользоваться ботом! У вас имеется бан');
            return ctx.scene.leave();
        }

        if (ctx.session.exitGems) {
            ctx.session.exitGems = false
            const profile = await redis.hgetall(`anket-${ctx.from?.id}`) as any;

            const iconsTop = getTopIcon(profile.top);
            const formatNumberCoin = formatNumber(profile.coin);
            const formatNumberLike = formatNumber(profile.like);
            const formatNumberDislike = formatNumber(profile.dislike);

            const profileMessage = `  
<b>${profile.premium ? '⭐ PREMIUM ⭐' : '💘 Анкета пользователя'}</b>
${iconsTop} <b>Место в топе:</b> ${profile.top}
———————————————  
${profile.gender ? '👱🏻‍♀️' : '👱🏻'} <b>Имя:</b> ${profile.name}  
🎂 <b>Возраст:</b> ${profile.age}  
📍 <b>Город:</b> ${profile.city}  
📖 <b>Описание:</b> ${profile.description}  
———————————————  
❤️ <b>Лайков:</b> ${formatNumberLike}  
👎 <b>Дизлайков:</b> ${formatNumberDislike}  
💠 <b>Гемы:</b> ${formatNumberCoin}  
`;


            const editMessage = await editMessageMorGems(ctx, profileMessage, {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "💠 Перевести гемы", callback_data: 'coins' }],
                        [{ text: "⚠️ Репорт", callback_data: `report` }]
                    ]
                }
            });

            if (!editMessage) {
                await ctx.reply('⚠️ Произошла ошибка! Попробуйте еще раз.');
                return
            }

            return ctx.wizard.next();
        }

        const interactionsCheck = await redis.hgetall(`user-interactions-${ctx.from?.id}`);

        if (Object.keys(interactionsCheck).length === 0) {
            try {
                const url = process.env.URL;

                const urlGet = `${url}/users/${ctx.from?.id}`;

                const req = await axios.get(urlGet);

                if (req.status === 400) {
                    throw new Error(`Ошибка: ${JSON.stringify(req.data.message)}`);
                }
                const user = req.data.message;

                let likesMax;
                let messageMax;

                if (user.premium) {
                    likesMax = 500
                    messageMax = 500
                } else {
                    likesMax = 10
                    messageMax = 5
                }

                await redis.hset(`user-interactions-${ctx.from?.id}`, {
                    likesMax: likesMax,
                    messageMax: messageMax,
                    like: '0',
                    message: '0'
                });

            } catch (err) {
                console.error(err);
                ctx.reply('Возникла ошибка! Попробуйте запустить поиск еще раз.')
            }
        }

        const manyAncket = await redis.llen(`viewed-${ctx.from?.id}`);

        console.log('manyAncket', manyAncket);

        if (manyAncket >= 100) {
            try {
                const url = process.env.URL;
                const viewed = await redis.lrange(`viewed-${ctx.from?.id}`, 0, -1);

                const userViewed = viewed.map(item => JSON.parse(item));

                console.log('userViewed', userViewed);

                const viewedMap = userViewed.map((item: any) => {
                    if (item.premium) {
                        if (item.count === 5) {
                            return item.id
                        }

                        return
                    } else {
                        return item.id
                    }
                })

                console.log('viewed', viewedMap);

                const req = await axios.put(`${url}/users/${ctx.from?.id}/viewed`, {
                    viewed: viewedMap
                }, {
                    validateStatus: () => true
                });

                await redis.ltrim(`viewed-${ctx.from?.id}`, 1, 0);

                if (req.status === 400) {
                    throw new Error(`Ошибка при обновлении viewed у юзера: ${JSON.stringify(req.data.message)}`)
                }

                console.log(req.data)
            } catch (err) {
                if (err instanceof Error) {
                    console.error(err.message)
                } else {
                    console.error(`Неизвестная ошибка при обоввлении viewed` + err);
                }

                await ctx.reply(
                    `<b>❗ Произошла непредвиденная ошибка!</b>\n\n` +
                    `К сожалению, что-то пошло не так. Пожалуйста, перезапустите поиск и попробуйте снова.`
                    , {
                        parse_mode: 'HTML'
                    }
                );

            }
        }

        const userSearch = await redis.lrange(`user-search-${ctx.from?.id}`, 0, -1);

        if (userSearch.length <= 0) {
            const bool = await testFucntion(ctx);

            if (!bool) {
                throw new Error('Ошибка в получении анкет с сервера');
            }

            const likesMax = await redis.hget(`user-interactions-${ctx.from?.id}`, 'likesMax');

            if (Number(likesMax) !== 500) {
                const randomMessage1 = await randomMessage();

                console.log('randomMessage1', randomMessage1);

                if (randomMessage1?.status === 202) {
                    const message = formatText(randomMessage1?.message || '');

                    if (randomMessage1.photo !== '') {
                        await ctx.replyWithPhoto(randomMessage1.photo || '', {
                            caption: message,
                            parse_mode: "HTML",
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        {
                                            text: 'Пропустить',
                                            callback_data: 'cancel'
                                        }
                                    ],
                                    [
                                        {
                                            text: 'Перейти в канал',
                                            url: randomMessage1.link || ''
                                        }
                                    ]
                                ]
                            }
                        }).then((sendMessage) => {
                            ctx.session.sendMessage = sendMessage.message_id;
                        });
                    } else {
                        await ctx.reply(message || 'test123', {
                            parse_mode: 'HTML',
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        {
                                            text: 'Пропустить',
                                            callback_data: 'cancel'
                                        }
                                    ],
                                    [
                                        {
                                            text: 'Перейти в канал',
                                            callback_data: `overrun-${randomMessage1.link}`
                                        }
                                    ]
                                ]
                            }
                        }).then((sendMessage) => {
                            ctx.session.sendMessage = sendMessage.message_id;
                        });;
                    }

                    return ctx.wizard.next();
                }

                await ctx.reply(randomMessage1?.message || 'test123', {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: 'Пропустить',
                                    callback_data: 'cancel'
                                }
                            ]
                        ]
                    }
                }).then((sendMessage) => {
                    ctx.session.sendMessage = sendMessage.message_id;
                });;

                return ctx.wizard.next();
            }

        }

        const values1 = await redis.lrange(`user-search-${ctx.from?.id}`, 0, -1);

        const id = values1[0];

        const url = process.env.URL;

        const req = await axios.get(`${url}/users/${id}`);

        console.log(req.data.message);

        const message = req.data.message;

        const profile = {
            id: req.data.message.id,
            name: req.data.message.name,
            description: req.data.message.description,
            photo: req.data.message.photo,
            like: req.data.message.like,
            dislike: req.data.message.dislike,
            premium: req.data.message.premium,
            age: req.data.message.age,
            city: req.data.message.city,
            coin: req.data.message.coin,
            top: req.data.message.top,
            gender: req.data.message.gender
        };

        await redis.hset(`anket-${ctx.from?.id}`, profile);

        const iconsTop = getTopIcon(profile.top);
        const formatNumberCoin = formatNumber(profile.coin);
        const formatNumberLike = formatNumber(profile.like);
        const formatNumberDislike = formatNumber(profile.dislike);

        if (ctx.session.keyboard) {
            await ctx.reply('🔍 Поиск', {
                reply_markup: {
                    keyboard: [
                        [
                            {
                                text: '❤️'
                            },
                            {
                                text: '💬'
                            },
                            {
                                text: '👎'
                            },
                            {
                                text: '👤'
                            }
                        ]
                    ],
                    resize_keyboard: true,
                    one_time_keyboard: false
                }
            });

            ctx.session.keyboard = false
        }

        const bottomStats: string[] = [];

        if (message.likeWieved) {
            bottomStats.push(`❤️ <b>Лайков:</b> ${formatNumberLike}`);
        }
        if (message.dislikeWieved) {
            bottomStats.push(`👎 <b>Дизлайков:</b> ${formatNumberDislike}`);
        }
        if (message.coinWieved) {
            bottomStats.push(`💠 <b>Гемы:</b> ${formatNumberCoin}`);
        }


        const profileMessage = `  
<b>${profile.premium ? '⭐ PREMIUM ⭐' : '💘 Анкета пользователя'}</b>
${iconsTop} <b>Место в топе:</b> ${profile.top}
———————————————  
${profile.gender ? '👱🏻‍♀️' : '👱🏻'} <b>Имя:</b> ${profile.name}  
🎂 <b>Возраст:</b> ${profile.age}  
📍 <b>Город:</b> ${profile.city}  
📖 <b>Описание:</b> ${profile.description}  
${bottomStats.length ? '———————————————\n' + bottomStats.join('\n') : ''}
`;
        await ctx.replyWithPhoto(profile.photo, {
            caption: profileMessage,
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [
                    [{ text: "💠 Перевести гемы", callback_data: 'coins' }],
                    [{ text: "⚠️ Репорт", callback_data: `report` }]
                ]
            }
        }).then((sendMessage) => {
            ctx.session.sendMessage = sendMessage.message_id;
        });

        return ctx.wizard.next()
    } catch (err) {
        console.error(err);
        return ctx.scene.leave();
    }
}, async (ctx) => {
    if (!ctx.callbackQuery) {
        if (ctx.message !== undefined) {
            if ('text' in ctx.message) {
                await handleCommandSearch(ctx);
            }
        }
        return
    }

    if ("data" in ctx.callbackQuery) {
        const url = process.env.URL;

        const checkSubscription = await checkSubscriptionMiddleware(ctx)

        if (!checkSubscription) {
            return;
        }

        const data = ctx.callbackQuery.data;

        switch (data) {
            case 'dislike':
                try {
                    const userData = await redis.hget(`anket-${ctx.from?.id}`, 'id');

                    if (!userData) {
                        await ctx.reply(
                            "❌ Произошла ошибка! Перезапустите поиск и попробуйте еще раз."
                        );
                        return ctx.scene.leave();
                    }


                    const putUrlDislike = `${url}/match/dislike/${userData}`;
                    const req = await axios.put(putUrlDislike);

                    if (req.status === 400) {
                        throw new Error(`${JSON.stringify(req.data.message)}`);
                    };

                    const result = await editMessage(ctx);

                    console.log('result', result);

                    if (!result) {
                        throw new Error('Ошибка в исправлении сообщения!');
                    }

                    await updateViewed(userData || '', req.data.premium, ctx.from?.id || 0)

                    await redis.lpop(`user-search-${ctx.from?.id}`);

                    return ctx.scene.enter('ancetScene');
                } catch (err) {
                    if (err instanceof Error) {
                        console.error(err.message);
                    }
                    await ctx.reply('⚠️ Произошла ошибка! Попробуйте еще раз');
                }
                break
            case 'like':
                try {
                    const userData = await redis.hget(`anket-${ctx.from?.id}`, 'id');

                    if (!userData) {
                        await ctx.reply(
                            "❌ Произошла ошибка! Перезапустите поиск и попробуйте еще раз."
                        );
                        return ctx.scene.leave();
                    }


                    const likes = await redis.hget(`user-interactions-${ctx.from?.id}`, 'like');
                    const likesMax = await redis.hget(`user-interactions-${ctx.from?.id}`, 'likesMax');

                    if (likesMax == null) {
                        return
                    }

                    if (likes == null) {
                        return
                    } else if (likes >= likesMax) {
                        ctx.reply('Вы отправили максимальное кол-во лайков! Возвращайтесь через 12 часов.');
                        const result = await editMessage(ctx);

                        if (!result) {
                            throw new Error('Ошибка в исправлении сообщения!');
                        }
                        return ctx.scene.leave()
                    } else {
                        await redis.hincrby(`user-interactions-${ctx.from?.id}`, 'like', 1);
                    }

                    const body = {
                        fromId: `${ctx.from?.id}`,
                        metch: false,
                        message: ''
                    }

                    const putUrlLike = `${url}/match/like/${userData}`;
                    const req = await axios.put(putUrlLike, body);

                    if (req.status === 400) {
                        throw new Error(`${JSON.stringify(req.data.message)}`);
                    }

                    const result = await editMessage(ctx);

                    if (!result) {
                        throw new Error('Ошибка в исправлении сообщения!');
                    }

                    await updateViewed(userData || '', req.data.premium, ctx.from?.id || 0)

                    await redis.lpop(`user-search-${ctx.from?.id}`);
                    return ctx.scene.enter('ancetScene');
                } catch (err) {
                    if (err instanceof Error) {
                        console.error(err.message);
                    }
                    await ctx.reply('⚠️ Произошла ошибка! Попробуйте еще раз');
                    return
                }
                break
            case 'report':
                const userData = await redis.hget(`anket-${ctx.from?.id}`, 'id');

                if (!userData) {
                    await ctx.reply(
                        "❌ Произошла ошибка! Перезапустите поиск и попробуйте еще раз."
                    );
                    return ctx.scene.leave();
                }

                ctx.scene.enter('ancetReport');
                break
            case 'message':
                const userData2 = await redis.hget(`anket-${ctx.from?.id}`, 'id');

                if (!userData2) {
                    await ctx.reply(
                        "❌ Произошла ошибка! Перезапустите поиск и попробуйте еще раз."
                    );
                    return ctx.scene.leave();
                }


                const message = await redis.hget(`user-interactions-${ctx.from?.id}`, 'message');
                const messageMax = await redis.hget(`user-interactions-${ctx.from?.id}`, 'messageMax');

                if (messageMax == null || message == null) {
                    return
                }

                if (message >= messageMax) {
                    ctx.reply('Вы отправили максимальное кол-во писем! Возвращайтесь через 12 часов.');
                    return ctx.scene.leave()
                } else {
                    await redis.hincrby(`user-interactions-${ctx.from?.id}`, 'message', 1);
                }

                ctx.scene.enter('ancetSceneMessage');
                break
            case 'coins':
                await ctx.scene.enter('ancetSceneGems');
                break
            case 'cancel':
                const result = await editMessage(ctx);

                console.log('result', result);

                if (!result) {
                    throw new Error('Ошибка в исправлении сообщения!');
                }
                await ctx.scene.enter('ancetScene');
                break
            default:

                await ctx.reply(
                    '⚠️ <b>Вы нажали что-то не то!</b> Попробуйте ещё раз.',
                    { parse_mode: 'HTML' }
                );
                break

        }
    }
})


export const ancetReport = new Scenes.WizardScene<MyContext>('ancetReport', async (ctx) => {
    if (!ctx.callbackQuery) {
        if (ctx.message !== undefined) {
            if ('text' in ctx.message) {
                await handleCommandSearch(ctx);
            }
        }
        return
    }

    try {
        const url = process.env.URL;
        const userData = await redis.hget(`anket-${ctx.from?.id}`, 'id');

        const req = await axios.post(`${url}/report/${userData}`);

        if (req.status === 400) {
            throw new Error(JSON.stringify(req.data.message));
        }

        const result = await editMessage(ctx);

        if (!result) {
            throw new Error('Ошибка в исправлении сообщения!');
        }

        await updateViewed(userData || '', req.data.premium, ctx.from?.id || 0)

        await redis.lpop(`user-search-${ctx.from?.id}`);

        await ctx.reply('<b>✅ Репорт успешно отправлен!</b>', { parse_mode: 'HTML' });
        return ctx.scene.enter('ancetScene');
    } catch (err) {
        if (err instanceof Error) {
            console.error(err.message);
        }
        await ctx.reply('⚠️ Произошла ошибка! Попробуйте еще раз.');
        return
    }
})

export const ancetSceneMessage = new Scenes.WizardScene<MyContext>('ancetSceneMessage', async (ctx) => {
    const result = await editMessage(ctx);

    if (!result) {
        await ctx.reply('⚠️ Произошла ошибка! Попробуйте еще раз.');
        return ctx.scene.enter('ancetScene');
    }

    await ctx.reply(`<b>✉️ Написать</b>\n\nВведите сообщение для анкеты.`, {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: `Вернуться назад`,
                        callback_data: 'no'
                    }
                ]
            ]
        }
    }).then((sendMessage) => {
        ctx.session.sendMessage = sendMessage.message_id;
    });;

    return ctx.wizard.next();
}, async (ctx) => {
    if (!ctx.message) {
        if (ctx.callbackQuery) {
            if ('data' in ctx.callbackQuery) {
                const data = ctx.callbackQuery.data;

                if (data === 'no') {
                    await editMessage(ctx);

                    return ctx.scene.enter('ancetScene');
                }


            }
        }

        await ctx.reply("<b>Используйте кнопку</b> 'Вернуться назад' <b>или напишите текст для письма</b>", {
            parse_mode: "HTML"
        });

        return
    }

    if ("text" in ctx.message) {
        const messageUser = ctx.message.text;
        const url = process.env.URL;

        try {
            const body = {
                fromId: `${ctx.from?.id}`,
                metch: false,
                message: messageUser
            }

            const userData = await redis.hget(`anket-${ctx.from?.id}`, 'id');

            const putUrlLike = `${url}/match/like/${userData}`;
            const req = await axios.put(putUrlLike, body, {
                validateStatus: () => true
            });

            if (req.status === 400) {
                throw new Error(`${JSON.stringify(req.data.message)}`);
            }


            await ctx.reply('<b>Ваше письмо отправлено!</b> ✨', {
                parse_mode: 'HTML'
            });
            await updateViewed(userData || '', req.data.premium, ctx.from?.id || 0)

            await redis.lpop(`user-search-${ctx.from?.id}`);
            return ctx.scene.enter('ancetScene');
        } catch (err) {
            if (err instanceof Error) {
                console.error(err.message);
            }
            ctx.reply(`${err instanceof Error ? err.message : 'Please, check console'}`);
        }

    }

});

export const ancetSceneGems = new Scenes.WizardScene<MyContext>('ancetSceneGems', async (ctx) => {
    if (!ctx.callbackQuery) {
        if (ctx.message !== undefined) {
            if ('text' in ctx.message) {
                await handleCommandSearch(ctx);
            }
        }
        return
    }

    const url = process.env.URL;

    const req = await axios.get(`${url}/users/${ctx.from?.id}`, {
        validateStatus: () => true
    });

    if (req.status === 400) {
        await ctx.reply('⚠️ Произошла ошибка! Перезапустите поиск и попробуйте еще раз.');
        return
    }

    const coins = req.data.message.coin

    if (coins < 100) {
        const editMessage = await editMessageMorGems(ctx, '🚫 Недостаточно гемов для перевода!', {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'Выйти',
                            callback_data: 'exit'
                        }
                    ]
                ]
            }
        });

        if (!editMessage) {
            await ctx.reply('⚠️ Произошла ошибка! Перезапусти поиск и попробуй еще раз.');
            return
        }

        return ctx.wizard.next();
    }


    const options = [100, 500, 1000, 5000];
    const available = options.filter(option => option <= req.data.message.coin);

    const keyboard: { text: string, callback_data: string }[][] = [];

    for (let i = 0; i < available.length; i += 2) {
        const row = [
            {
                text: `${available[i]} 💠`,
                callback_data: `send_${available[i]}`
            }
        ];

        if (available[i + 1]) {
            row.push({
                text: `${available[i + 1]} 💠`,
                callback_data: `send_${available[i + 1]}`
            });
        }

        keyboard.push(row);
    }

    const editMessage = await editMessageMorGems(ctx, 'Сколько вы хотите передать гемов?', {
        reply_markup: {
            inline_keyboard: [
                ...keyboard,
                [
                    {
                        text: `Вернуться назад`,
                        callback_data: 'exit'
                    }
                ]
            ]
        }
    });

    if (!editMessage) {
        await ctx.reply('⚠️ Произошла ошибка! Попробуй еще раз.');
        return
    }

    return ctx.wizard.next();
}, async (ctx) => {
    if (!ctx.callbackQuery) {
        if (ctx.message !== undefined) {
            if ('text' in ctx.message) {
                await handleCommandSearch(ctx);
            }
        }
        return
    }

    if ("data" in ctx.callbackQuery) {
        const data = ctx.callbackQuery.data;

        if (data === "exit") {
            ctx.session.exitGems = true
            return ctx.scene.enter('ancetScene');

        } else if (data.startsWith('send_')) {
            const parts = data.split('_');
            const value = Number(parts[1]);
            const idAnket = await redis.hget(`anket-${ctx.from?.id}`, 'id');

            const url = process.env.URL;
            try {
                const likes = await redis.hget(`user-interactions-${ctx.from?.id}`, 'like');
                const likesMax = await redis.hget(`user-interactions-${ctx.from?.id}`, 'likesMax');

                if (likesMax == null) {
                    return
                }

                if (likes == null) {
                    return
                } else if (likes >= likesMax) {
                    ctx.reply('Вы отправили максимальное кол-во лайков! Возвращайтесь через 12 часов.');
                    const result = await editMessage(ctx);

                    if (!result) {
                        throw new Error('Ошибка в исправлении сообщения!');
                    }
                    return ctx.scene.leave()
                } else {
                    await redis.hincrby(`user-interactions-${ctx.from?.id}`, 'like', 1);
                }

                const reqCoin = await axios.put(`${url}/match/coin/${ctx.from?.id}/${idAnket}`,
                    {
                        count: value
                    },
                    {
                        validateStatus: () => true
                    }
                );

                if (reqCoin.status === 401) {
                    await ctx.reply(JSON.stringify(reqCoin.data.message));
                }

                if (reqCoin.status === 400) {
                    throw new Error(JSON.stringify(reqCoin.data.message));
                }

                const reqLike = await axios.put(`${url}/match/like/${idAnket}`, {
                    fromId: `${ctx.from?.id}`,
                    metch: false,
                    message: '',
                    coins: value
                });

                if (reqLike.status === 400) {
                    throw new Error(`${JSON.stringify(reqLike.data.message)}`);
                }

                const result = await editMessage(ctx);

                if (!result) {
                    throw new Error('Ошибка в исправлении сообщения!');
                }

                await updateViewed(idAnket || '', reqLike.data.premium, ctx.from?.id || 0)

                await redis.lpop(`user-search-${ctx.from?.id}`);
                return ctx.scene.enter('ancetScene');
            } catch (err) {
                if (err instanceof Error) {
                    console.error('err in scene gems', err.message);
                } else {
                    console.error('invalid err in scene gems', err);
                }

                await ctx.reply('⚠️ Произошла ошибка! Попробуйте еще раз.');
            }
        }
    }
})

const updateViewed = async (id: string, premium: boolean, ctxId: number) => {
    const dataAncket = {
        premium: premium,
        count: 1,
        id: id
    }

    const manyAncket = await redis.lrange(`viewed-${ctxId}`, 0, -1);

    const exits = manyAncket.map((item) => {
        const parseItem = JSON.parse(item)
        if (parseItem.id === dataAncket.id) {
            return parseItem
        }
    });

    const dataExits = exits[0];

    if (dataExits) {
        dataExits.count += 1;

        await redis.lrem(`viewed-${ctxId}`, 0, exits[0]);

        await redis.lpush(`viewed-${ctxId}`, JSON.stringify(dataExits));
        await redis.expire(`viewed-${ctxId}`, 43200);
    } else {
        await redis.lpush(`viewed-${ctxId}`, JSON.stringify(dataAncket));
        await redis.expire(`viewed-${ctxId}`, 43200);
    }
}

const randomMessage = async () => {
    const chance = Math.random();

    if (chance <= 0.35) {
        const message = `
🔥 Станьте обладателем <b>⭐ PREMIUM ⭐</b> и получите эксклюзивные возможности:

1️⃣ 🔍 <b>Без ограничений:</b> Ищите анкеты без всяких лимитов!
2️⃣ 🛡️ <b>Скрытие характеристик:</b> Удобно управляйте отображением лайков и дизлайков.
3️⃣ 🌟 <b>Выделенная анкета:</b> Ваша анкета будет иметь статус <b>⭐ PREMIUM ⭐</b> вместо стандартного 💘.
4️⃣ 🚀 <b>Приоритет в поиске:</b> Ваша анкета появится в поиске первой и будет показываться в 5 раз чаще!
 `
        return { message: message, status: 201 };
    } else if (chance <= 0.80) {
        try {
            const url = process.env.URL;
            const req = await axios.get(`${url}/advertisement`);

            if (req.status === 400) {
                throw new Error('Ошибка в получении списка каналов!');
            }

            const obj = getRandomObject(req.data.message);

            console.log(obj);
            return { message: String(obj.text), status: 202, link: String(obj.link), photo: String(obj.photo) };
        } catch (err) {
            console.error(err);
            return await randomMessage();
        }
    } else {
        const random = Math.floor(Math.random() * 3) + 1
        let message;

        switch (random) {
            case 1:
                message = '💠 <b>Топ формируется на основе гемов!</b>\n' +
                    'Вы можете получать <b>гемы</b> несколькими способами:\n' +
                    '• Открывайте <b>ежедневные кейсы</b>, чтобы получить гемы.\n' +
                    '• <b>Покупайте кейсы за гемы</b>, и в них ты также можете получить дополнительные гемы!\n' +
                    '• Вы также можете <b>получать гемы от других пользователей</b>, обменивайся и увеличивай свои шансы попасть в топ!'
                break
            case 2:
                message = '🔍 <b>Настрой параметры поиска!</b>\n' +
                    'Ты можешь точно настроить поиск, чтобы находить именно тех людей, которые тебе интересны:\n' +
                    '• Установи <b>минимальный и максимальный возраст</b> для поиска.\n' +
                    '• Выбери свой <b>город</b> или настрой <b>координаты</b>, чтобы увидеть пользователей поблизости.'
                break
            case 3:
                message = '📍 <b>Проблемы с поиском анкет?</b>\n' +
                    'Если вы не видите подходящих анкет, проверьте, правильно ли указан город — возможно, в нём есть ошибка.\n' +
                    'Чтобы улучшить точность поиска, мы рекомендуем включить определение местоположения и отправить свою геолокацию. Это можно сделать в настройках поиска.';

                break
            default:
                break
        }

        return { message: message, status: 203 };
    }
}


function getRandomObject(objects: any) {
    const randomIndex = Math.floor(Math.random() * objects.length);
    return objects[randomIndex];
}

export async function handleCommandSearch(ctx: any) {
    if ('text' in ctx.message) {
        const message = ctx.message?.text;

        const checkSubscription = await checkSubscriptionMiddleware(ctx)

        if (!checkSubscription) {
            return;
        }

        if (ctx.session.sendMessage) {
            const result = await editMessage(ctx);

            if (!result) {
                console.log('Ошибка в исправлении сообщения!');
            }
        }

        if (message.startsWith('/')) {
            switch (message) {
                case '/profile':
                    return ctx.scene.enter('profileScene');
                case '/search':
                    ctx.session.keyboard = true
                    ctx.session.sendMessage = 0
                    return ctx.scene.enter('ancetScene');
                case '/send':
                    await ctx.reply(`💠 <b>Перевод гемов</b>`, {
                        ...buttonNavProfile,
                        parse_mode: "HTML",
                    }
                    );
                    ctx.session.exitGems = false
                    ctx.session.sendMessage = 0
                    return ctx.scene.enter('sendGems');
                case '/likes':
                    await ctx.reply(`❤️ <b>Лайки</b>`, {
                        ...buttonNavProfile,
                        parse_mode: "HTML",
                    }
                    );
                    return ctx.scene.enter('getLikes');
                case '/metches':
                    await ctx.reply(`💌 <b>Метчи</b>`, {
                        ...buttonNavProfile,
                        parse_mode: "HTML",
                    }
                    );

                    ctx.session.sendMessage = 0;
                    ctx.session.count = 0;
                    return ctx.scene.enter('getMetch');
                case '/reported':
                    return ctx.scene.enter('reportScene');
                case '/nexySession':
                    ctx.reply(JSON.stringify(ctx.session));
                    return ctx.scene.leave();
                case '/top':
                    await ctx.reply(`🥇 <b>Топ</b>`, {
                        ...buttonNavProfile,
                        parse_mode: "HTML",
                    }
                    );
                    ctx.session.sendMessage = 0
                    ctx.session.countTop = 1
                    return ctx.scene.enter('topScenes');
                case '/help':
                    await ctx.reply(`🔹 <b>Помощь</b>`, {
                        ...buttonNavProfile,
                        parse_mode: "HTML",
                    }
                    );

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

                    return ctx.scene.leave()
                case '/luchaevaMuda':
                    return ctx.scene.enter('adminScene');
                case '/shop':
                    await ctx.reply(`🛒 <b>Магазин</b>`, {
                        ...buttonNavProfile,
                        parse_mode: "HTML",
                    }
                    );
                    ctx.session.exitGems = false;
                    return ctx.scene.enter("shopScene");
                case '/case':
                    await ctx.reply(`📦 <b>Кейсы</b>`, {
                        ...buttonNavProfile,
                        parse_mode: "HTML",
                    }
                    );
                    return ctx.scene.enter('caseScene');
                case '/ref':
                    await ctx.reply(`🔗 <b>Рефералка</b>`, {
                        ...buttonNavProfile,
                        parse_mode: "HTML",
                    }
                    );

                    return ctx.scene.enter("referalScene");
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
                case '/start':
                    const referralCode = ctx.message.text.split(' ')[1];

                    console.log('referralCode', referralCode);

                    if (referralCode !== undefined) {
                        console.log('work')
                        await redis.set(`ref-${ctx.from.id}`, referralCode)

                        const ref = await redis.get(`ref-${ctx.from.id}`)

                        console.log("ref", ref)
                    }

                    await ctx.reply(`
                        👋 Привет! Добро пожаловать в наш бот знакомств! 💘  
                        
                        📌 Здесь ты можешь найти интересных людей, общаться и, возможно, встретить свою любовь.  
                        
                        🔹 Чтобы начать, заполни свою анкету:  
                        👉 Введи команду /register
                        
                        💡 После регистрации ты сможешь искать людей с помощью команды /search.  
                        📨 Если у вас с кем-то совпадение, вы сможете переписываться!  
                        
                        🚀 Давай начнем? Введи /register и создадим твою анкету!
                        `)
                case '/register':
                    return ctx.scene.enter('regScene');


                default:
                    await ctx.reply('❌ Неизвестная команда. Попробуйте /help для получения списка доступных команд.');
                    break;
            }
            return;
        }

        const url = process.env.URL;

        switch (message) {
            case '👤':
                return ctx.scene.enter('profileScene');
            case '❤️':
                try {
                    const userData = await redis.hget(`anket-${ctx.from?.id}`, 'id');

                    if (!userData) {
                        await ctx.reply(
                            "❌ Произошла ошибка! Перезапустите поиск и попробуйте еще раз."
                        );
                        return ctx.scene.leave();
                    }


                    const likes = await redis.hget(`user-interactions-${ctx.from?.id}`, 'like');
                    const likesMax = await redis.hget(`user-interactions-${ctx.from?.id}`, 'likesMax');

                    if (likesMax == null) {
                        return
                    }

                    if (likes == null) {
                        return
                    } else if (likes >= likesMax) {
                        await ctx.reply('Вы отправили максимальное кол-во лайков! Возвращайтесь через 12 часов.');

                        return ctx.scene.leave()
                    } else {
                        await redis.hincrby(`user-interactions-${ctx.from?.id}`, 'like', 1);
                    }

                    const body = {
                        fromId: `${ctx.from?.id}`,
                        metch: false,
                        message: ''
                    }

                    const putUrlLike = `${url}/match/like/${userData}`;
                    const req = await axios.put(putUrlLike, body);

                    if (req.status === 400) {
                        throw new Error(`${JSON.stringify(req.data.message)}`);
                    }

                    await updateViewed(userData || '', req.data.premium, ctx.from?.id || 0)

                    await redis.lpop(`user-search-${ctx.from?.id}`);
                    return ctx.scene.enter('ancetScene');
                } catch (err) {
                    if (err instanceof Error) {
                        console.error(err.message);
                    }
                    await ctx.reply('⚠️ Произошла ошибка! Попробуйте еще раз');

                    return
                }
            case '💬':
                const userData2 = await redis.hget(`anket-${ctx.from?.id}`, 'id');

                if (!userData2) {
                    await ctx.reply(
                        "❌ Произошла ошибка! Перезапустите поиск и попробуйте еще раз."
                    );
                    return ctx.scene.leave();
                }


                const message = await redis.hget(`user-interactions-${ctx.from?.id}`, 'message');
                const messageMax = await redis.hget(`user-interactions-${ctx.from?.id}`, 'messageMax');

                if (messageMax == null || message == null) {
                    return
                }

                if (message >= messageMax) {
                    ctx.reply('Вы отправили максимальное кол-во писем! Возвращайтесь через 12 часов.');
                    return ctx.scene.leave()
                } else {
                    await redis.hincrby(`user-interactions-${ctx.from?.id}`, 'message', 1);
                }

                return ctx.scene.enter('ancetSceneMessage');
            case '👎':
                try {
                    const userData = await redis.hget(`anket-${ctx.from?.id}`, 'id');

                    if (!userData) {
                        await ctx.reply(
                            "❌ Произошла ошибка! Перезапустите поиск и попробуйте еще раз."
                        );
                        return ctx.scene.leave();
                    }

                    const putUrlDislike = `${url}/match/dislike/${userData}`;
                    const req = await axios.put(putUrlDislike);

                    if (req.status === 400) {
                        throw new Error(`${JSON.stringify(req.data.message)}`);
                    };

                    await updateViewed(userData || '', req.data.premium, ctx.from?.id || 0)

                    await redis.lpop(`user-search-${ctx.from?.id}`);

                    return ctx.scene.enter('ancetScene');
                } catch (err) {
                    if (err instanceof Error) {
                        console.error(err.message);
                    }
                    await ctx.reply('⚠️ Произошла ошибка! Попробуйте еще раз');
                    return
                }
            default:
                await ctx.reply('⚠️ Используйте кнопки!');
                return;
        }
    }
}