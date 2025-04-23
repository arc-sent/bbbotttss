import axios from "axios";
import { redis } from "..";

export const Payments = async (ctx: any, count: number, day: number) => {
    try {
        const url = process.env.URL;

        const newPayload = await axios.post(`${url}/payments/${ctx.from.id}`, {
            amountStar: count,
            type: 'PREMIUM'
        });

        if (newPayload.status === 400) {
            throw new Error(JSON.stringify(newPayload.data));
        }

        const dataNewPayload = newPayload.data.message;

        console.log("dataNewPayload", dataNewPayload);

        await ctx.sendInvoice({
            title: `Покупка премиума на ${day} дней`,
            description: `Оплата премиум-доступа на ${day} дней на сумму ${count} XTR.`,
            payload: dataNewPayload.invoice_payload,
            currency: 'XTR',
            prices: [
                { label: 'XTR', amount: count },
            ],
            provider_token: '',
        });

        await redis.set(`pay-${ctx.from.id}`, JSON.stringify({ payload: dataNewPayload.invoice_payload, days: day, type: 'PREMIUM' }));
        await redis.expire(`pay-${ctx.from.id}`, 3600);

    } catch (err) {
        if (err instanceof Error) {
            console.error(err.message);
        } else {
            console.error('Invalid error', err)
        }

        await ctx.reply('Ошибка при создании платежа! Попробуйте еще раз');
    }
}

export const PaymentsGems = async (ctx: any, count: number, amount: number) => {
    try {
        const url = process.env.URL;

        const newPayload = await axios.post(`${url}/payments/${ctx.from.id}`, {
            amountStar: count,
            type: 'GEMS'
        });

        if (newPayload.status === 400) {
            throw new Error(JSON.stringify(newPayload.data));
        }

        const dataNewPayload = newPayload.data.message;

        console.log("dataNewPayload", dataNewPayload);

        await ctx.sendInvoice({
            title: `Покупка ${amount} гемов`,
            description: `Оплата ${amount} гемов на сумму ${count} XTR.`,
            payload: dataNewPayload.invoice_payload,
            currency: 'XTR',
            prices: [
                { label: 'XTR', amount: count },
            ],
            provider_token: '',
        });

        

        await redis.set(`pay-${ctx.from.id}`, JSON.stringify({ payload: dataNewPayload.invoice_payload, count: amount, type: 'GEMS' }));
        await redis.expire(`pay-${ctx.from.id}`, 3600);

    } catch (err) {
        if (err instanceof Error) {
            console.error(err.message);
        } else {
            console.error('Invalid error', err)
        }

        await ctx.reply('Ошибка при создании платежа! Попробуйте еще раз');
    }
}