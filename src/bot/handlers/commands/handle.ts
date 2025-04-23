import { checkSubscriptionMiddleware } from '../../index';
import axios from 'axios';
import { editMessage as editMessageFromGetAnket } from '../search/getAnket';
import { redis } from '../../index';

export async function handleCommand1(ctx: any) {
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
                await ctx.reply('⚠️ Используйте кнопки!');
                return;
        }
    }
}

export const getTopIcon = (top: number) => {
    if (top === 1) return '👑';
    if (top <= 3) return '🏅';
    if (top <= 10) return '🔥';
    if (top <= 50) return '⚡';
    return '📊';
};

export function formatNumber(num: number) {
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + "B";
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
    return num.toString();
}

export function formatText(rawText: string) {
    return rawText
        .replace(/\\n/g, '\n')
}

