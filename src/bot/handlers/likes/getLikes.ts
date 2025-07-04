import axios from 'axios';
import { MyContext } from './../../interfaces/state';
import { Scenes } from "telegraf";
import { redis } from '../..';
import { formatNumber, getTopIcon, handleCommand1 } from '../commands/handle';

const EditMessageLike = async (ctx: any) => {
    try {
        await ctx.telegram.editMessageReplyMarkup(
            ctx.chat.id,
            ctx.session.sendMessage,
            undefined,
            null
        );

        return { status: true }
    } catch (err) {
        return { message: err, status: false }
    }
}

export const getLikes = new Scenes.WizardScene<MyContext>("getLikes", async (ctx) => {
    try {
        const banned = await redis.get(`ban-${ctx.from?.id}`);
        if (banned === 'true') {
            await ctx.reply('Вы не можете пользоваться ботом! У вас имеется бан');
            return ctx.scene.leave();
        }

        const url = process.env.URL;

        const userId = ctx.from?.id;

        const urlGet = `${url}/likes/${userId}`;
        const req = await axios.get(urlGet);

        if (req.status === 400) {
            throw new Error(`${JSON.stringify(req.data.message)} , status: 400`);
        }

        const arrPending = req.data.message;

        if (arrPending.length === 0) {
            ctx.reply(`<b>😔 Пока нет лайков...</b>\n\nНо не переживайте! Ваша анкета уже в поиске. Добавьте больше фото и заполните профиль, чтобы привлечь внимание! 💫`, {
                parse_mode: "HTML"
            })
            return ctx.scene.leave();
        }

        const firstProfile = arrPending[0];

        console.log(firstProfile);

        const urlGetProfile = `${url}/users/${firstProfile.fromId}`;

        const reqProfile = await axios.get(urlGetProfile);

        if (reqProfile.status === 400) {
            throw new Error(`${JSON.stringify(req.data.message)}`);
        }

        const findUser = reqProfile.data.message;
        console.log(findUser);

        const userInfo = await ctx.telegram.getChat(findUser.id);
        console.log(userInfo);

        const iconsTop = getTopIcon(findUser.top);
        const formatNumberCoin = formatNumber(findUser.coin);
        const formatNumberLike = formatNumber(findUser.like);
        const formatNumberDislike = formatNumber(findUser.dislike);

        let profileMessage;

        if (firstProfile.message !== '') {
            profileMessage = `
<b>${findUser.premium ? '⭐ PREMIUM ⭐' : '💘 Анкета пользователя'}</b>
${iconsTop} <b>Место в топе:</b> ${findUser.top}
———————————————  
${findUser.gender ? '👱🏻‍♀️' : '👱🏻'} <b>Имя:</b> ${findUser.name}   
🎂 <b>Возраст:</b> ${findUser.age}  
📍 <b>Город:</b> ${findUser.city}  
📖 <b>Описание:</b> ${findUser.description}  
———————————————  
❤️ <b>Лайков:</b> ${formatNumberLike}  
👎 <b>Дизлайков:</b> ${formatNumberDislike}
💎 <b>Гемы:</b> ${formatNumberCoin}  
———————————————  
💬 <b>Сообщение от отправителя:</b> ${firstProfile.message}`;
        } else if (firstProfile.coins !== 0) {
            profileMessage = `
<b>${findUser.premium ? '⭐ PREMIUM ⭐' : '💘 Анкета пользователя'}</b>
${iconsTop} <b>Место в топе:</b> ${findUser.top}
———————————————  
${findUser.gender ? '👱🏻‍♀️' : '👱🏻'} <b>Имя:</b> ${findUser.name}   
🎂 <b>Возраст:</b> ${findUser.age}  
📍 <b>Город:</b> ${findUser.city}  
📖 <b>Описание:</b> ${findUser.description}  
———————————————  
❤️ <b>Лайков:</b> ${formatNumberLike}  
👎 <b>Дизлайков:</b> ${formatNumberDislike}
💎 <b>Гемы:</b> ${formatNumberCoin}  
———————————————  
💎 <b>Отправлено гемов:</b> ${formatNumber(firstProfile.coins)}`;
        } else {
            profileMessage = `
<b>${findUser.premium ? '⭐ PREMIUM ⭐' : '💘 Анкета пользователя'}</b>
${iconsTop} <b>Место в топе:</b> ${findUser.top}
———————————————  
${findUser.gender ? '👱🏻‍♀️' : '👱🏻'} <b>Имя:</b> ${findUser.name}   
🎂 <b>Возраст:</b> ${findUser.age}  
📍 <b>Город:</b> ${findUser.city}  
📖 <b>Описание:</b> ${findUser.description}  
———————————————  
❤️ <b>Лайков:</b> ${formatNumberLike}  
👎 <b>Дизлайков:</b> ${formatNumberDislike}
💎 <b>Гемы:</b> ${formatNumberCoin} 
`;
        }

        ctx.session.anket = { acketId: firstProfile.fromId, idPrisma: firstProfile.idPrisma };

        await ctx.replyWithPhoto(findUser.photo || '', {
            caption: profileMessage,
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "❤️", callback_data: `like` },
                        { text: "👎", callback_data: `dislike` }
                    ]
                ]
            }
        }).then((sendMessage) => {
            ctx.session.sendMessage = sendMessage.message_id;
        });

        return ctx.wizard.next();
    } catch (err) {
        if (err instanceof Error) {
            console.error(err.message);
        } else {
            console.error(err)
        }
        await ctx.reply('⚠️ Что-то пошло не так.\nПопробуйте перезапустить лайки.');
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
        if (ctx.callbackQuery.data === "like") {
            try {
                const body = {
                    fromId: `${ctx.from?.id}`,
                    metch: true
                }

                const putUrlLike = `${process.env.URL}/match/like/${ctx.session.anket.acketId}`;
                console.log(putUrlLike);
                const req = await axios.put(putUrlLike, body);

                if (req.status === 400) {
                    throw new Error(`${JSON.stringify(req.data.message)}`);
                }

                const pending = await deletePending(ctx.session.anket.idPrisma);
                console.log(pending)
                
                if (!pending) {
                    throw new Error('Ошибка в удалении юзера из массива ожидания');
                }

                ctx.session.anket = { acketId: '', idPrisma: '' };

                const edit = await EditMessageLike(ctx);

                if (!edit.status) {
                    throw new Error(JSON.stringify(edit.message));
                }

                return ctx.scene.enter("getLikes");

            } catch (err) {
                if (err instanceof Error) {
                    console.error(err.message);
                }
                await ctx.reply('⚠️ Что-то пошло не так.\nПопробуйте перезапустить лайки.');
            }
        } else if (ctx.callbackQuery.data === "dislike") {
            try {
                const pending = await deletePending(ctx.session.anket.idPrisma);
                console.log(pending)
                if (!pending) {
                    throw new Error('Ошибка в удалении юзера из массива ожидания');
                }

                ctx.session.anket = { acketId: '' };

                const edit = await EditMessageLike(ctx);

                if (!edit.status) {
                    throw new Error(JSON.stringify(edit.message));
                }

                return ctx.scene.enter("getLikes");
            } catch (err) {
                if (err instanceof Error) {
                    console.error(err.message);
                }
                await ctx.reply('⚠️ Что-то пошло не так.\nПопробуйте перезапустить лайки.');
            }
        }
    }
})

const deletePending = async (penId: string) => {
    try {
        const urlDelete = `${process.env.URL}/likes/pending/${penId}`;

        console.log(urlDelete);

        const req = await axios.delete(urlDelete);

        if (req.status === 400) {
            throw new Error(JSON.stringify(req.data));
        }

        return true
    } catch (err) {
        if (err instanceof Error) {
            console.log(err.message);
        } else {
            console.log(err)
        }

        return false
    }
}