import axios from 'axios';
import { MyContext } from './../interfaces/state';
import { Scenes } from "telegraf";
import { redis } from '..';
import { getTopIcon, formatNumber, handleCommand1 } from '../handlers/commands/handle';

const EditTopMessage = async (ctx: any) => {
    try {
        const url = process.env.URL;

        const req = await axios.get(`${url}/users/top/${ctx.session.countTop}`, {
            validateStatus: () => true
        });

        if (req.status === 400) {
            throw new Error(JSON.stringify(req.data.message));
        }

        const user = req.data.message;

        const iconsTop = getTopIcon(user.top);
        const formatNumberCoin = formatNumber(user.coin);
        const formatNumberLike = formatNumber(user.like);
        const formatNumberDislike = formatNumber(user.dislike);

        const profileMessage = `
<b>${user.premium ? '⭐ PREMIUM ⭐' : '💘 Анкета пользователя'}</b>
${iconsTop} <b>Место в топе:</b> ${user.top}
———————————————  
${user.gender ? '👱🏻‍♀️' : '👱🏻'} <b>Имя:</b> ${user.name}  
🎂 <b>Возраст:</b> ${user.age}   
📍 <b>Город:</b> ${user.city}  
📖 <b>Описание:</b> ${user.description}   
———————————————
❤️ <b>Лайков:</b> ${formatNumberLike}  
👎 <b>Дизлайков:</b> ${formatNumberDislike}  
💠 <b>Гемы:</b> ${formatNumberCoin}  
`;

        let keyboard;
        if (ctx.session.countTop === 1) {
            keyboard = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "⬅️", callback_data: `back-top` },
                        ]
                    ]
                }
            }
        } else if (ctx.session.countTop === 100) {
            keyboard = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "➡️", callback_data: `next-top` }
                        ]
                    ]
                }
            }
        } else {
            keyboard = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "⬅️", callback_data: `back-top` },
                            { text: "➡️", callback_data: `next-top` }
                        ]
                    ]
                }
            }
        }

        // await ctx.telegram.editMessageCaption(
        //     ctx.chat.id,
        //     ctx.session.sendMessage,
        //     undefined,
        //     profileMessage,
        //     {
        //         parse_mode: "HTML",
        //         ...keyboard
        //     }
        // );

        await ctx.telegram.editMessageMedia(
            ctx.chat.id,
            ctx.session.sendMessage,
            undefined,
            {
                type: 'photo',
                media: user.photo,
                caption: profileMessage,
                parse_mode: 'HTML'
            },
            keyboard
        );
        return { status: true }
    } catch (err) {
        if (err instanceof Error) {
            return { status: false, message: err.message }
        }

        return { status: false, message: 'Неизвестная ошибка при изменении сообщения' }
    }

}

export const topScenes = new Scenes.WizardScene<MyContext>('topScenes', async (ctx) => {
    try {
        if (ctx.session.sendMessage === 0) {
            const url = process.env.URL;

            const req = await axios.get(`${url}/users/top/${ctx.session.countTop}`, {
                validateStatus: () => true
            });

            if (req.status === 400) {
                throw new Error(JSON.stringify(req.data.message));
            }

            const user = req.data.message;

            const iconsTop = getTopIcon(user.top);
            const formatNumberCoin = formatNumber(user.coin);
            const formatNumberLike = formatNumber(user.like);
            const formatNumberDislike = formatNumber(user.dislike);

            const profileMessage = `
<b>${user.premium ? '⭐ PREMIUM ⭐' : '💘 Анкета пользователя'}</b>
${iconsTop} <b>Место в топе:</b> ${user.top}
 ———————————————  
${user.gender ? '👱🏻‍♀️' : '👱🏻'} <b>Имя:</b> ${user.name}  
🎂 <b>Возраст:</b> ${user.age}   
📍 <b>Город:</b> ${user.city}  
📖 <b>Описание:</b> ${user.description}   
———————————————
❤️ <b>Лайков:</b> ${formatNumberLike}  
👎 <b>Дизлайков:</b> ${formatNumberDislike}  
💠 <b>Гемы:</b> ${formatNumberCoin}  
`;

            await ctx.replyWithPhoto(user.photo.trim() || '', {
                caption: profileMessage,
                parse_mode: "HTML",
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "⬅️", callback_data: `back-top` },
                        ]
                    ]
                }
            }).then((sendMessage) => {
                ctx.session.sendMessage = sendMessage.message_id;
            });
        } else {
            const resultEdit = await EditTopMessage(ctx);

            if (!resultEdit.status) {
                throw new Error(resultEdit.message);
            }
        }

        return ctx.wizard.next();

    } catch (err) {
        if (err instanceof Error) {
            console.error('Ошибка в топе:', err.message);
        } else {
            console.error('Неизвестная ошибка в топе:', err);
        }

        await ctx.reply('⚠️ Что-то пошло не так.\nПопробуйте перезапустить топ и начать сначала.');

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
        const dataCalback = ctx.callbackQuery.data;

        switch (dataCalback) {
            case 'back-top':
                ctx.session.countTop++
                return ctx.scene.enter('topScenes');
            case 'next-top':
                ctx.session.countTop--
                return ctx.scene.enter('topScenes');
            default:
                await ctx.reply('⚠️ Используйте кнопки!');
                return;
        }
    }
})