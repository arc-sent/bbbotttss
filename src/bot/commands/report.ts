import { MyContext } from '../interfaces/state';
import { Scenes } from "telegraf";
import axios from "axios";
import { redis } from '..';

export const ReportScene = new Scenes.WizardScene<MyContext>('reportScene', async (ctx) => {
    try {
        const url = process.env.URL;

        const userData1 = await redis.hgetall(`user-${ctx.from?.id}`);

        if (Object.keys(userData1).length === 0) {
            const req = await axios.get(`${url}/users/${ctx.from?.id}`);

            if (req.status === 400) {
                throw new Error(req.data.message);
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

        const interactions = await redis.hgetall(`user-${ctx.from?.id}`);

        console.log('Выполненно 1');
        console.log('interactions', interactions);


        
        if (interactions.role !== 'admin') {
            await ctx.reply('⛔ У вас недостаточно прав для выполнения этого действия.');
            return ctx.scene.leave();
        }

        const llen = await redis.llen(`rep-hash-${ctx.from?.id}`);

        console.log("llen from if", llen);

        if (llen === 0) {
            const req = await axios.get(`${url}/report`);

            if (req.status === 400) {
                throw new Error(JSON.stringify(req.data.message));
            }
            if (typeof (req.data.message) === 'string') {
                await ctx.reply(req.data.message);
                return ctx.scene.leave();
            } else {
                await redis.lpush(`rep-hash-${ctx.from?.id}`, ...req.data?.message);
                console.log('Выполненно 2')
            }
        }

        const tasks = await redis.lrange(`rep-hash-${ctx.from?.id}`, 0, -1);
        console.log('tasks', tasks);
        const userId = tasks[0];

        const req = await axios.get(`${url}/users/${userId}`);

        if (req.status === 400) {
            throw new Error(JSON.stringify(req.data.message));
        }

        const user = req.data.message;

        await ctx.replyWithPhoto(user.photo, {
            caption: `<b>👤 Анкета пользователя</b>\n\n🆔 ID: ${user.id}\n📍 Город: ${user.city}\n📅 Возраст: ${user.age}\n💬 Описание: ${user.description}`,
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🚫 Заблокировать", callback_data: `ban` }],
                    [{ text: "✅ Оставить", callback_data: `approve` }]
                ]
            }
        });

        return ctx.wizard.next();
    } catch (err) {
        if (err instanceof Error) {
            console.error(err.message);
        } else {
            console.error(err)
        }
        await ctx.reply('Ошибка в создании хеша юзера! Проверьте консоль.');
        return ctx.scene.leave();
    }

}, async (ctx) => {
    const url = process.env.URL;
    if (ctx.callbackQuery !== undefined) {
        if ("data" in ctx.callbackQuery) {
            const tasks = await redis.lrange(`rep-hash-${ctx.from?.id}`, 0, -1);
            const userId = tasks[0];

            if (ctx.callbackQuery.data === 'ban') {
                try {
                    const req = await axios.post(`${url}/report/${userId}/banned`);

                    if (req.status === 400) {
                        throw new Error(JSON.stringify(req.data.message));
                    }

                    ctx.reply(`<b>Юзер ${userId}</b> успешно забанен! 🎉\nТеперь он не сможет больше нарушать правила. 🚫`, {
                        parse_mode: 'HTML'
                    });

                    await redis.lpop(`rep-hash-${ctx.from?.id}`);

                    return ctx.scene.enter('reportScene');
                } catch (err) {
                    console.error(err);
                    if (err instanceof Error) {
                        console.error(err.message);
                    }
                    ctx.reply(`${err instanceof Error ? err.message : 'Please, check console'}`);
                    return ctx.scene.leave();
                }
            } else if (ctx.callbackQuery.data === 'approve') {
                try {
                    const req = await axios.post(`${url}/report/${userId}/leave`);

                    if (req.status === 400) {
                        throw new Error(JSON.stringify(req.data.message));
                    }

                    ctx.reply('<b>С юзера успешно сняли все обвинения</b> ✅', {
                        parse_mode: 'HTML'
                    });

                    await redis.lpop(`rep-hash-${ctx.from?.id}`);

                    return ctx.scene.enter('reportScene');
                } catch (err) {
                    if (err instanceof Error) {
                        console.error(err.message);
                    }
                    ctx.reply(`${err instanceof Error ? err.message : 'Please, check console'}`);
                    return ctx.scene.leave();
                }
            }
        }
    }
});

