import axios from "axios";
import { redis } from "..";

export const checkoutQuery = async (ctx: any) => {
    try {
        const pay = await redis.get(`pay-${ctx.from.id}`);

        if (!pay) {
            throw new Error('Ошибка в получнии findId');
        }

        const findIdParse = JSON.parse(pay);
        const findId = findIdParse.payload;

        const url = process.env.URL;

        const findPayments = await axios.get(`${url}/payments/${findId}`);

        if (findPayments.status === 400) {
            throw new Error(JSON.stringify(findPayments.data));
        }

        await ctx.answerPreCheckoutQuery(true);

    } catch (err) {
        if (err instanceof Error) {
            console.error(err.message);
        } else {
            console.error('Invalid error', err)
        }

        await ctx.answerPreCheckoutQuery(false, 'Ошибка при проверке платежа. Попробуйте еще раз');
    }
}
