import axios from 'axios';
import { MyContext } from './../../interfaces/state';
import { Scenes } from "telegraf";
import { redis } from '../../index';
import { formatNumber, getTopIcon, handleCommand1 } from '../commands/handle';

const EditMetchMessage = async (ctx: any) => {
    try {
        if (!ctx.chat.id) {
            throw new Error('Ошибка в получении айди чата')
        }

        const url = process.env.URL;
        const req = await axios.get(`${url}/matchReal/${ctx.from?.id}`);

        if (req.status === 400) {
            throw new Error(JSON.stringify(req.data.message));
        }

        const data = req.data.message[ctx.session.count];
        console.log('data', req.data.message);
        const fromId = data.fromId;

        let username;
        try {
            const userData = await ctx.telegram.getChat(fromId) as any;
            username = userData.username;
        } catch (err) {
            console.error(err);
        }

        let keyboard;

        if (ctx.session.count === 0) {
            keyboard = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "⬅️", callback_data: `back` },
                        ]
                    ]
                }
            }
        } else if (ctx.session.count === req.data.message.length - 1) {
            keyboard = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "➡️", callback_data: `next` }
                        ]
                    ]
                }
            }
        } else {
            keyboard = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "⬅️", callback_data: `back` },
                            { text: "➡️", callback_data: `next` }
                        ]
                    ]
                }
            }
        }

        if (username === undefined) {
            await ctx.telegram.editMessageMedia(
                ctx.chat.id,
                ctx.session.sendMessage,
                undefined,
                {
                    type: 'photo',
                    media: 'AgACAgIAAxkBAAICBmfw83lQdBCDj8r0BSYba8GssjgWAAI_6jEbKveJS8zowWcSpWheAQADAgADcwADNgQ',
                    caption: 'Нет информации о юзере',
                    parse_mode: 'HTML'
                },
                keyboard
            );

            return { status: true }
        }

        const findUser = await axios.get(`${url}/users/${fromId}`);

        const datafindUser = findUser.data.message;

        const iconsTop = getTopIcon(datafindUser.top);
        const formatNumberCoin = formatNumber(datafindUser.coin);
        const formatNumberLike = formatNumber(datafindUser.like);
        const formatNumberDislike = formatNumber(datafindUser.dislike);

        let profileMessage;


        if (data.message === '') {
            profileMessage = `
<b>${datafindUser.premium ? '⭐ PREMIUM ⭐' : '💘 Анкета пользователя'}</b>
${iconsTop} <b>Место в топе:</b> ${datafindUser.top}
———————————————  
${datafindUser.gender ? '👱🏻‍♀️' : '👱🏻'} <b>Имя:</b> ${datafindUser.name}   
🔹 <b>Никнейм:</b> ${`@${username}` || "не указан"}  
🎂 <b>Возраст:</b> ${datafindUser.age}  
📍 <b>Город:</b> ${datafindUser.city}  
📖 <b>Описание:</b> ${datafindUser.description}  
———————————————  
❤️ <b>Лайков:</b> ${formatNumberLike}  
👎 <b>Дизлайков:</b> ${formatNumberDislike}
💎 <b>Гемы:</b> ${formatNumberCoin} 
    `;
        } else {
            profileMessage = `
<b>${datafindUser.premium ? '⭐ PREMIUM ⭐' : '💘 Анкета пользователя'}</b>
${iconsTop} <b>Место в топе:</b> ${datafindUser.top}
———————————————  
${datafindUser.gender ? '👱🏻‍♀️' : '👱🏻'} <b>Имя:</b> ${datafindUser.name} 
🔹 <b>Никнейм:</b> ${`@${username}` || "не указан"}  
🎂 <b>Возраст:</b> ${datafindUser.age}  
📍 <b>Город:</b> ${datafindUser.city}  
📖 <b>Описание:</b> ${datafindUser.description}  
———————————————  
❤️ <b>Лайков:</b> ${formatNumberLike}  
👎 <b>Дизлайков:</b> ${formatNumberDislike}
💎 <b>Гемы:</b> ${formatNumberCoin} 
———————————————  
💬 <b>Сообщение от отправителя:</b> ${data.message}`;
        }

        await ctx.telegram.editMessageMedia(
            ctx.chat.id,
            ctx.session.sendMessage,
            undefined,
            {
                type: 'photo',
                media: datafindUser.photo,
                caption: profileMessage,
                parse_mode: 'HTML'
            },
            keyboard
        );
        return { status: true }
    } catch (err: any) {
        if (
            err?.description === "Bad Request: message is not modified" ||
            err?.message?.includes("message is not modified")
        ) {
            return { status: true }
        }

        if (err instanceof Error) {
            return { status: false, message: err.message }
        }

        return { status: false, message: 'Неизвестная ошибка при изменении сообщения' }
    }

}


export const getMetch = new Scenes.WizardScene<MyContext>('getMetch', async (ctx) => {
    try {
        const url = process.env.URL;

        const banned = await redis.get(`ban-${ctx.from?.id}`);

        if (banned === 'true') {
            await ctx.reply('Вы не можете пользоваться ботом! У вас имеется бан');
            return ctx.scene.leave();
        }

        if (ctx.session.sendMessage === 0) {
            const req = await axios.get(`${url}/matchReal/${ctx.from?.id}`);

            if (req.status === 400) {
                throw new Error(JSON.stringify(req.data.message));
            }

            if (req.data.banned) {
                ctx.reply('Вы не можете пользоваться ботом! У вас имеется бан');
                return ctx.scene.leave();
            }

            if (req.data.message.length === 0) {
                ctx.reply(`<b>😔 Пока нет метчей...</b>\n\nНо не переживайте! Как только кто-то лайкнет вас в ответ, вы сразу узнаете об этом. 💫`, {
                    parse_mode: 'HTML'
                })

                return ctx.scene.leave();
            }

            const data = req.data.message[ctx.session.count];
            const fromId = data.fromId;

            let username;

            try {
                const userData = await ctx.telegram.getChat(fromId) as any;
                username = userData.username;
            } catch (err) {
                console.error(err);
            }

            if (username === undefined) {
                await ctx.replyWithPhoto('AgACAgIAAxkBAAICBmfw83lQdBCDj8r0BSYba8GssjgWAAI_6jEbKveJS8zowWcSpWheAQADAgADcwADNgQ', {
                    caption: 'Нет информации о юзере',
                    parse_mode: "HTML",
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: "⬅️", callback_data: `back` },
                            ]
                        ]
                    }
                }).then((sendMessage) => {
                    ctx.session.sendMessage = sendMessage.message_id;
                });
                return ctx.wizard.next();
            }

            const findUser = await axios.get(`${url}/users/${fromId}`);

            const datafindUser = findUser.data.message;

            const iconsTop = getTopIcon(datafindUser.top);
            const formatNumberCoin = formatNumber(datafindUser.coin);
            const formatNumberLike = formatNumber(datafindUser.like);
            const formatNumberDislike = formatNumber(datafindUser.dislike);

            let profileMessage;

            if (req.data.message.length === 1) {
                if (data.message === '') {
                    profileMessage = `
<b>${datafindUser.premium ? '⭐ PREMIUM ⭐' : '💘 Анкета пользователя'}</b>
${iconsTop} <b>Место в топе:</b> ${datafindUser.top}
———————————————  
${datafindUser.gender ? '👱🏻‍♀️' : '👱🏻'}👤 <b>Имя:</b> ${datafindUser.name}  }  
🔹 <b>Никнейм:</b> ${`@${username}` || "не указан"}  
🎂 <b>Возраст:</b> ${datafindUser.age}  
📍 <b>Город:</b> ${datafindUser.city}  
📖 <b>Описание:</b> ${datafindUser.description}  
———————————————  
❤️ <b>Лайков:</b> ${formatNumberLike}  
👎 <b>Дизлайков:</b> ${formatNumberDislike}
💎 <b>Гемы:</b> ${formatNumberCoin}  
    `;
                } else {
                    profileMessage = `
<b>${datafindUser.premium ? '⭐ PREMIUM ⭐' : '💘 Анкета пользователя'}</b>
${iconsTop} <b>Место в топе:</b> ${datafindUser.top}
———————————————  
${datafindUser.gender ? '👱🏻‍♀️' : '👱🏻'}👤 <b>Имя:</b> ${datafindUser.name}  
🔹 <b>Никнейм:</b> ${`@${username}` || "не указан"}  
🎂 <b>Возраст:</b> ${datafindUser.age}  
📍 <b>Город:</b> ${datafindUser.city}  
📖 <b>Описание:</b> ${datafindUser.description}  
———————————————  
❤️ <b>Лайков:</b> ${datafindUser.like}  
👎 <b>Дизлайков:</b> ${datafindUser.dislike}
💎 <b>Гемы:</b> ${formatNumberCoin}  
———————————————  
💬 <b>Сообщение от отправителя:</b> ${data.message}`;
                }

                await ctx.replyWithPhoto(datafindUser.photo || '', {
                    caption: profileMessage,
                    parse_mode: "HTML"
                })
                return ctx.wizard.next();
            }

            if (data.message === '') {
                profileMessage = `
<b>${datafindUser.premium ? '⭐ PREMIUM ⭐' : '💘 Анкета пользователя'}</b>
${iconsTop} <b>Место в топе:</b> ${datafindUser.top}
———————————————  
${datafindUser.gender ? '👱🏻‍♀️' : '👱🏻'}👤 <b>Имя:</b> ${datafindUser.name}  
🔹 <b>Никнейм:</b> ${`@${username}` || "не указан"}  
🎂 <b>Возраст:</b> ${datafindUser.age}  
📍 <b>Город:</b> ${datafindUser.city}  
📖 <b>Описание:</b> ${datafindUser.description}  
———————————————  
❤️ <b>Лайков:</b> ${datafindUser.like}  
👎 <b>Дизлайков:</b> ${datafindUser.dislike}
💎 <b>Гемы:</b> ${formatNumberCoin}  
    `;
            } else {
                profileMessage = `
<b>${datafindUser.premium ? '⭐ PREMIUM ⭐' : '💘 Анкета пользователя'}</b>
${iconsTop} <b>Место в топе:</b> ${datafindUser.top}
———————————————   
${datafindUser.gender ? '👱🏻‍♀️' : '👱🏻'}<b>Имя:</b> ${datafindUser.name}  
🔹 <b>Никнейм:</b> ${`@${username}` || "не указан"}  
🎂 <b>Возраст:</b> ${datafindUser.age}  
📍 <b>Город:</b> ${datafindUser.city}  
📖 <b>Описание:</b> ${datafindUser.description}  
———————————————  
❤️ <b>Лайков:</b> ${datafindUser.like}  
👎 <b>Дизлайков:</b> ${datafindUser.dislike}
💎 <b>Гемы:</b> ${formatNumberCoin}  
———————————————  
💬 <b>Сообщение от отправителя:</b> ${data.message}`;
            }

            await ctx.replyWithPhoto(datafindUser.photo || '', {
                caption: profileMessage,
                parse_mode: "HTML",
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "⬅️", callback_data: `back` },
                        ]
                    ]
                }
            }).then((sendMessage) => {
                ctx.session.sendMessage = sendMessage.message_id;
            });

        } else {
            const resultEdit = await EditMetchMessage(ctx);

            if (!resultEdit.status) {
                throw new Error(resultEdit.message);
            }
        }

        return ctx.wizard.next();
    } catch (err) {
        if (err instanceof Error) {
            console.error(err.message);
        } else {
            console.error(err)
        }
        await ctx.reply('⚠️ Что-то пошло не так.\nПопробуйте перезапустить метчи.');

        return ctx.wizard.next()
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
        if (ctx.callbackQuery.data === 'back') {
            ctx.session.count++
            ctx.scene.enter('getMetch')
        } else if (ctx.callbackQuery.data === 'next') {
            ctx.session.count--
            ctx.scene.enter('getMetch')
        }
    }
})