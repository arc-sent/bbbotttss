import axios from "axios";
import { redis } from "..";

export const successfulPayment = async (ctx: any) => {
    try {
        const url = process.env.URL;
        const pay = await redis.get(`pay-${ctx.from.id}`);

        if (!pay) {
            throw new Error('Ошибка в получнии findId');
        }

        const findIdParse = JSON.parse(pay);

        console.log(findIdParse);

        if (findIdParse.type === 'PREMIUM') {
            const updatePayment = await axios.put(`${url}/payments/${findIdParse.payload}`, {
                telegramId: ctx.telegram.token
            });

            if (updatePayment.status === 400) {
                throw new Error(JSON.stringify(updatePayment.data));
            }

            const updateUserPremium = await axios.put(`${url}/users/${ctx.from.id}/premium`, {
                premium: true,
                days: findIdParse.days
            })

            if (updateUserPremium.status === 400) {
                throw new Error(JSON.stringify(updateUserPremium.data));
            }

            await ctx.reply(`
    🎉 <b>Поздравляем!</b> Вы стали обладателем ⭐ <b>PREMIUM</b> ⭐ на ${findIdParse.days === 1 ? `${findIdParse.days} день` : `${findIdParse.days} дней`}!
    `, {
                parse_mode: 'HTML'
            });

        } else if (findIdParse.type === 'GEMS') {
            const updatePayment = await axios.put(`${url}/payments/${findIdParse.payload}`, {
                telegramId: ctx.telegram.token
            }, {
                validateStatus: () => true
            });

            if (updatePayment.status === 400) {
                throw new Error(JSON.stringify(updatePayment.data.messsage));
            }

            const updateUserGems = await axios.put(`${url}/users/${ctx.from.id}/gems`, {
                action: 'increment',
                count: findIdParse.count
            }, {
                validateStatus: () => true
            });

            if (updateUserGems.status === 400) {
                throw new Error(JSON.stringify(updateUserGems.data.messsage));
            }

            console.log('updateUserGems', updateUserGems.data.messsage);

            await ctx.reply(`
                🎉 <b>Поздравляем!</b> Вы успешно приобрели 💠 <b>${findIdParse.count} гемов</b> за звезды!`, {
                parse_mode: 'HTML'
            });

        } else {
            throw new Error('Ошибка в получении типа платежа!');
        }

        await ctx.scene.enter('profileScene');
    } catch (err) {
        if (err instanceof Error) {
            console.error(err.message);
        } else {
            console.error('Invalid error', err)
        }

        await ctx.reply('Ошибка при подтверждении платежа. Обратитесь в поддержку');
    }
}
