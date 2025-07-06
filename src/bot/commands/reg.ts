import axios from 'axios';
import { MyContext } from '../interfaces/state';
import { Scenes } from "telegraf";
import { buttonSaveAgain } from "../keyboards/Interaction";
import { redis } from '..';
import { editMessage } from '../handlers/search/getAnket';

export const regScene = new Scenes.WizardScene<MyContext>('regScene', async (ctx) => {
    const userId = ctx.from?.id;

    try {
        const urlGet = `${process.env.URL}/users/${userId}`;

        const reqGet = await axios.get(urlGet);

        if (reqGet.status === 200) {
            const findUser = reqGet.data.message;

            if (findUser.banned) {
                ctx.reply('Вы не можете пользоваться ботом! У вас имеется бан');

                return ctx.scene.leave();
            }
            await ctx.reply('Вы уже зарегестрированы!');
            await redis.set(`ban-${ctx.from?.id}`, "false");

            return ctx.scene.enter('profileScene');
        }


    } catch (err) {
        console.log(err);

        await ctx.reply('Как вас зовут?');

        return ctx.wizard.next();
    }
}, async (ctx) => {
    if (!ctx.message) {
        ctx.reply('⚠️ Используйте текст. Введите свое имя еще раз');
        return
    }

    if ("text" in ctx.message) {
        const message = ctx.message.text;

        ctx.session.name = message;

        await ctx.reply('Отлично! Теперь выберите свой пол', {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'Мужской',
                            callback_data: 'man'
                        }
                    ],
                    [
                        {
                            text: 'Женский',
                            callback_data: 'woman'
                        }
                    ]
                ]
            }
        }).then((sendMessage) => {
            ctx.session.sendMessage = sendMessage.message_id;
        });;

        return ctx.wizard.next();
    }
}, async (ctx) => {
    if (!ctx.callbackQuery) {
        await ctx.reply('⚠️ Используйте кнопки.');
        return
    }

    if ("data" in ctx.callbackQuery) {
        const dataCalback = ctx.callbackQuery.data;
        const result = await editMessage(ctx);

        console.log('result', result);

        if (!result) {
            throw new Error('Ошибка в исправлении сообщения!');
        }


        switch (dataCalback) {
            case 'man':
                ctx.session.gender = false

                await ctx.reply('Теперь введите описание профиля');

                return ctx.wizard.next();
            case 'woman':
                ctx.session.gender = true

                await ctx.reply('Теперь введите описание профиля');

                return ctx.wizard.next();
            default:
                await ctx.reply('⚠️ Используйте кнопки! Попобуйте еще раз');
                return;
        }
    }

}, async (ctx) => {
    if (!ctx.message) {
        ctx.reply('⚠️ Используйте текст. Введите свое описание еще раз');
        return
    }

    if ("text" in ctx.message) {
        const message = ctx.message.text;

        ctx.session.description = message;

        await ctx.reply('Теперь введите свой город или отправьте свою геолокацию (Скрепка → Локация → Отправить)');

        return ctx.wizard.next();

    }
}, async (ctx) => {
    if (!ctx.message) {
        ctx.reply('⚠️ Используйте текст');
        return
    }

    if ("text" in ctx.message) {
        const message = ctx.message.text;

        ctx.session.city = message;

        await ctx.reply('Сколько вам лет? Введите возраст от 0 до 99 лет');

        return ctx.wizard.next();

    }

    if ('location' in ctx.message) {
        const { latitude, longitude } = ctx.message.location;

        const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;

        const req = await axios.get(url, {
            validateStatus: () => true
        });

        if (req.status === 400) {
            throw new Error(JSON.stringify(req.data));
        }

        const city = req.data.address.city || req.data.address.town || req.data.address.village || req.data.address.municipality || req.data.address.hamlet

        if (!city) {
            await ctx.reply('Возникла ошибка при получении гео! Попробуйте выбрать ближайший населенный пункт или ввести его название.');
            return
        }

        ctx.session.city = city;

        await ctx.reply('Сколько вам лет? Введи возраст от 0 до 99 лет');

        return ctx.wizard.next();
    }
}, async (ctx) => {
    if (!ctx.message) {
        ctx.reply('⚠️ Используйте текст.');
        return
    }

    if ("text" in ctx.message) {
        const message = ctx.message.text;

        if (/[a-zA-Z]/.test(message) && /[а-яА-Я]/.test(message)) {
            ctx.reply('⚠️ Введите свой возраст диапазоном от 0 до 99 лет');
            return
        }

        ctx.session.age = message;

        await ctx.reply('Хорошо! Пожалуйста, отправьте фотографию как файл:\n— на мобильном: нажмите «📎» → «Файл» → выберите фото из галереи;\n— на компьютере: отправьте фотографию без сжатия.\nЭто поможет сохранить лучшее качество изображения для вашего профиля.');

        return ctx.wizard.next();

    }
}, async (ctx) => {
    if (ctx.message === undefined) {
        ctx.reply('⚠️ Отправьте файл еще раз.');
        return
    }

    if ('document' in ctx.message) {
        const document = ctx.message.document;

        const type_file = document.mime_type

        if (type_file !== 'image/jpeg') {
            await ctx.reply('Пожалуйста, отправьте файл с расширением .png или .jpeg');

            return
        }

        ctx.session.document = document;

        await ctx.reply('Отлично! Теперь скиньте фотографию, которая будет использована в вашей анкете.')
        return ctx.wizard.next();
    }
}, async (ctx) => {
    if (ctx.message === undefined) {
        ctx.reply('⚠️ Отправьте свою фотку еще раз.');
        return
    }

    if ("photo" in ctx.message) {
        const photo = ctx.message?.photo;

        const fileId = photo[0].file_id
        ctx.session.photo = fileId;

        const profileMessage = `
💘 <b>Анкета пользователя</b>  
———————————————  
${ctx.session.gender ? '👱🏻‍♀️' : '👱🏻'} <b>Имя:</b> ${ctx.session.name}  
🎂 <b>Возраст:</b> ${ctx.session.age}  
📍 <b>Город:</b> ${ctx.session.city}  
📖 <b>Описание:</b> ${ctx.session.description}  
——————————————— 
`;

        await ctx.sendDocument(ctx.session.document || '')

        await ctx.replyWithPhoto(ctx.session.photo || '', {
            caption: profileMessage,
            parse_mode: "HTML",
            ...buttonSaveAgain
        }).then((sendMessage) => {
            ctx.session.sendMessage = sendMessage.message_id;
        });

        return ctx.wizard.next();
    }
}, async (ctx) => {
    if (!ctx.callbackQuery) {
        ctx.reply('⚠️ Необходимо использовать кнопки.');
        return
    }

    const result = await editMessage(ctx);

    console.log('result', result);

    if (!result) {
        console.log('Ошибка в исправлении сообщения!');
    }

    if ('data' in ctx.callbackQuery) {
        if (ctx.callbackQuery.data === 'again') {
            return ctx.scene.enter('regScene');
        } else if (ctx.callbackQuery.data === 'save') {
            try {
                const urlPost = `${process.env.URL}/users/`;

                const body = {
                    name: ctx.session.name,
                    id: `${ctx.from?.id}`,
                    photo: ctx.session.photo,
                    description: ctx.session.description,
                    age: Number(ctx.session.age),
                    city: ctx.session.city,
                    gender: ctx.session.gender,
                    photoMiniApp: ctx.session.document
                };


                const reqPost = await axios.post(urlPost, body);

                if (reqPost.status === 400) {
                    throw new Error(JSON.stringify(reqPost.data));
                }

                ctx.session.banned = false;

                const ref = await redis.get(`ref-${ctx.from?.id}`);

                console.log('ref', ref);

                if (ref !== null) {
                    try {
                        const url = process.env.URL;

                        const req = await axios.put(`${url}/users/referal/${ref}/${ctx.from?.id}`, {
                            validateStatus: () => true
                        });

                        if (req.status === 400) {
                            throw new Error(JSON.stringify(req.data.message));
                        };

                        await ctx.reply(
                            `🎉 Поздравляем! Вы успешно перешли по реферальной ссылке и получили награду! 🎁\n\n` +
                            `Вы получили:\n` +
                            `💠 5000 гемов\n` +
                            `1 мистический кейс\n` +
                            `1 бронзовый кейс\n\n` +
                            `Если хотите получить больше наград, приглашайте друзей и получайте бонусы! 🎯`
                        );

                    } catch (err) {
                        if (err instanceof Error) {
                            console.error(err.message);
                        } else {
                            console.log(err);
                        }

                        await ctx.reply(
                            `⚠️ Произошла ошибка при получении награды за переход по реферальной ссылке! 😕\n\n` +
                            `Не переживайте, наша команда уже работает над решением этой проблемы.\n` +
                            `Пожалуйста, напишите в поддержку, и мы помогем вам как можно скорее! 🛠️\n\n` +
                            `Спасибо за ваше терпение! 💬`
                        );
                    }
                }

                return ctx.scene.enter('profileScene');
            } catch (err) {
                if (err instanceof Error) {
                    console.error(err.message);
                }
                console.error(err);
                await ctx.reply('⚠️ Произошла ошибка! Попробуйте еще раз');
                return
            }
        }
    }
})