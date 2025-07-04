import { editMessageMorGems, editMessageOnlyText } from './../search/getAnket';
import { BodyStatistics, MyContext } from './../../interfaces/state';
import { buttonSaveAgain, EditButtons, buttonNav, interactionButtonEdit, buttonsPremium, buttonsGems, buttonNavProfile } from './../../keyboards/Interaction';
import axios from "axios";
import { Scenes } from "telegraf";
import { buttonEditDelete } from "../../keyboards/Interaction";
import { redis } from '../..';
import { Payments, PaymentsGems } from '../../payments/payments';
import { formatNumber, getTopIcon, handleCommand1 } from '../commands/handle';
import { editMessage as editMessageFromGetAnket } from '../search/getAnket';

export const profileScene = new Scenes.WizardScene<MyContext>('profileScene', async (ctx) => {
    const userId = ctx.from?.id;

    if (!userId) {
        throw new Error('Ошибка в получении юзера');
    }

    const banned = await redis.get(`ban-${ctx.from?.id}`);

    if (banned === 'true') {
        await ctx.reply('Вы не можете пользоваться ботом! У вас имеется бан');
        return ctx.scene.leave();
    }


    const url = process.env.URL;
    const urlGet = `${url}/users/${userId}`;

    const req = await axios.get(urlGet);

    if (req.status === 400) {
        throw new Error(`Ошибка: ${JSON.stringify(req.data.message)}`);
    }

    const user = req.data.message;

    if (user.banned) {
        await ctx.reply('Вы не можете пользоваться ботом! У вас имеется бан');
        redis.set(`ban-${ctx.from?.id}`, "true");
        return ctx.scene.leave();
    }

    await redis.hset(`user-${ctx.from.id}`, {
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
        role: user.role,
        photoMiniApp: user.photoMiniApp
    });

    const interactions = await redis.hgetall(`user-interactions-${ctx.from.id}`);

    if (Object.keys(interactions).length === 0) {
        let likesMax;
        let messageMax;

        if (user.premium) {
            likesMax = 500
            messageMax = 500
        } else {
            likesMax = 10
            messageMax = 5
        }

        await redis.hset(`user-interactions-${ctx.from.id}`, {
            likesMax: likesMax,
            messageMax: messageMax,
            like: '0',
            message: '0'
        });
    }

    const userData = await redis.hgetall(`user-${ctx.from.id}`);
    await redis.expire(`user-${ctx.from.id}`, 600);

    const iconsTop = getTopIcon(user.top);
    const formatNumberCoin = formatNumber(user.coin);
    const formatNumberLike = formatNumber(user.like);
    const formatNumberDislike = formatNumber(user.dislike);

    const profileMessage = `
<b>${user.premium ? '⭐ PREMIUM ⭐' : '💘 Анкета пользователя'}</b>
${iconsTop} <b>Место в топе:</b> ${user.top}
———————————————  
${user.gender ? '👱🏻‍♀️' : '👱🏻'} <b>Имя:</b> ${userData.name}  
🎂 <b>Возраст:</b> ${userData.age}   
📍 <b>Город:</b> ${userData.city}  
📖 <b>Описание:</b> ${userData.description}  
🎯 <b>Возрастной диапазон:</b> ${userData.minAge} - ${userData.maxAge}
${user.searchGender ? '👱🏻‍♀️' : '👱🏻'} <b>Пол поиска:</b> ${user.searchGender ? 'Женский' : 'Мужской'}    
———————————————
❤️ <b>Лайков:</b> ${formatNumberLike}  
👎 <b>Дизлайков:</b> ${formatNumberDislike}  
💠 <b>Гемы:</b> ${formatNumberCoin}  
`;

    await ctx.reply(`👤 <b>Ваш профиль</b>`, {
        ...buttonNavProfile,
        parse_mode: "HTML",
    }
    );


    await ctx.replyWithPhoto(userData.photo.trim() || '', {
        caption: profileMessage,
        parse_mode: "HTML",
        ...buttonEditDelete,
    }).then((sendMessage) => {
        ctx.session.sendMessage = sendMessage.message_id;
    });

    return ctx.wizard.next();
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
            case 'edit':
                return ctx.scene.enter('editScene');
            case 'unplug':
                try {
                    const url = process.env.URL;
                    const req = await axios.put(`${url}/users/${ctx.from?.id}/shutdown`, {
                        status: true
                    }, {
                        validateStatus: () => true
                    });

                    if (req.status === 400) {
                        throw new Error(JSON.stringify(req.data.message));
                    }

                    const result = await editMessageFromGetAnket(ctx);

                    if (!result) {
                        console.log('Ошибка в исправлении сообщения!');
                    }

                    await ctx.reply(
                        `✅ <b>Анкета успешно отключена!</b>\n\n` +
                        `Если захотите вернуться, просто нажмите на кнопку ниже 👇`,
                        {
                            parse_mode: 'HTML',
                            reply_markup: {
                                keyboard: [
                                    [
                                        {
                                            text: 'Включить анкету'
                                        }
                                    ]
                                ],
                                resize_keyboard: true,
                                one_time_keyboard: true,
                            }
                        }
                    );



                    return ctx.scene.leave();
                } catch (err) {
                    if (err instanceof Error) {
                        console.error(`Ошибка при отключении анкеты: ${err.message}`)
                    } else {
                        console.error(`Ошибка при отключении анкеты. Ошибка неизвестная: ${err}`)
                    }

                    await ctx.reply('Ошибка при отключении анкеты! Попробуйте позже.')
                }

                return ctx.scene.leave();
            case 'mini_app':
                return ctx.scene.enter('miniAppScene');
            default:
                await ctx.reply('⚠️ Используйте кнопки!');
                return;
        }
    }
})


export const miniAppScene = new Scenes.WizardScene<MyContext>('miniAppScene', async (ctx) => {
    if (!ctx.callbackQuery) {
        if (ctx.message !== undefined) {
            if ('text' in ctx.message) {
                await handleCommand1(ctx);
            }
        }
    }

    const result = await editMessageFromGetAnket(ctx);

    if (!result) {
        console.log('Ошибка в исправлении сообщения!');
    }

    const userData = await redis.hget(`user-${ctx.from?.id}`, "photoMiniApp");

    if (userData) {
        await ctx.sendDocument(userData || '', {
            caption: '📸 Здесь вы можете изменить фотографию анкеты в мини-приложении или открыть его.',
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: '📝 Обновить фото в мини-приложении',
                            callback_data: 'edit-mini-app'
                        }
                    ],
                    [
                        {
                            text: '🚀 Открыть мини-приложение',
                            web_app: {
                                url: "https://a2ba-31-131-74-62.ngrok-free.app"
                            }

                        }
                    ]
                ]
            }
        }).then((sendMessage) => {
            ctx.session.sendMessage = sendMessage.message_id;
        });
    } else {
        await ctx.reply(
            "📷 Чтобы воспользоваться мини-приложением, добавьте фотографию в анкету с помощью кнопки ниже.",
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: '📝 Добавить фото в мини-приложении',
                                callback_data: 'edit-mini-app'
                            }
                        ]
                    ]
                }
            }
        ).then((sendMessage) => {
            ctx.session.sendMessage = sendMessage.message_id;
        });
    }



    return ctx.wizard.next()
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

        const result = await editMessageFromGetAnket(ctx);

        if (dataCalback === 'edit-mini-app') {
            return ctx.scene.enter('editPhotoInAnket');
        }
    }
});



export const editScene = new Scenes.WizardScene<MyContext>('editScene', async (ctx) => {
    const result = await editMessageFromGetAnket(ctx);

    if (!result) {
        console.log('Ошибка в исправлении сообщения!');
    }

    await ctx.reply(
        `<b>⚙️ Настройки анкеты</b>\n\n` +
        `1️⃣ <b>Изменить имя</b>\n` +
        `2️⃣ <b>Изменить описание</b>\n` +
        `3️⃣ <b>Изменить фотографию</b>\n` +
        `4️⃣ <b>Изменить возраст</b>\n` +
        `5️⃣ <b>Изменить город</b>\n` +
        `6️⃣ <b>Изменить пол</b>\n` +
        `7️⃣ <b>Изменить пол поиска</b>\n` +
        `8️⃣ <b>Изменить возрастной диапазон</b>\n` +
        `9️⃣ <b>Изменить статистику (Доступно с премиумом)</b>\n` +
        `🔟 <b>Заполнить анкету заново</b>\n\n` +
        `📌 Выбери действие, нажав на соответствующую кнопку ниже.`,
        { parse_mode: "HTML", ...EditButtons }
    ).then((sendMessage) => {
        ctx.session.sendMessage = sendMessage.message_id;
    });
    return ctx.wizard.next();
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
        const message = ctx.callbackQuery.data;

        const userData1 = await redis.hgetall(`user-${ctx.from?.id}`);

        const result = await editMessageFromGetAnket(ctx);

        if (!result) {
            console.log('Ошибка в исправлении сообщения!');
        }

        switch (message) {
            case '1':
                await ctx.scene.enter('editName');
                break

            case '2':
                await ctx.scene.enter('editDescription');
                break

            case '3':
                ctx.scene.enter('editPhoto');
                break

            case '4':
                await ctx.scene.enter('editAge');
                break

            case '5':
                await ctx.scene.enter('editCity');
                break

            case '6':
                await ctx.scene.enter('editGender');
                break

            case '7':
                await ctx.scene.enter('editGenderSearch');
                break

            case '8':
                await ctx.scene.enter('editMinMax');
                break

            case '9':
                const boolean = userData1.premium === "1" ? true : false;
                if (!boolean) {
                    await ctx.reply(`
🚫 <b>Доступ ограничен!</b>  
    
🔒 Для управления статистикой необходим ⭐ PREMIUM ⭐.  
✨ Оформи премиум и получи доступ к этой функции!  
`, { parse_mode: 'HTML' });
                } else {
                    await ctx.scene.enter('editStatistics');
                }
                break

            case '10':
                return ctx.scene.enter('refreshScene');
            default:
                break
        }
    }

})

export const editGender = new Scenes.WizardScene<MyContext>('editGender', async (ctx) => {
    await ctx.reply('Выберете ваш пол', {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: 'Мужской',
                        callback_data: 'false'
                    }
                ],
                [
                    {
                        text: 'Женский',
                        callback_data: 'true'
                    }
                ]
            ]
        }
    }).then((sendMessage) => {
        ctx.session.sendMessage = sendMessage.message_id;
    });;

    return ctx.wizard.next();
}, async (ctx) => {
    if (!ctx.callbackQuery) {
        ctx.reply('⚠️ Используйте кнопки');
        return
    }

    if ("data" in ctx.callbackQuery) {
        const message = ctx.callbackQuery.data;

        const result = await editMessageFromGetAnket(ctx);

        if (!result) {
            console.log('Ошибка в исправлении сообщения!');
        }

        if (message === 'true' || message === 'false') {
            console.log('message', message);
            const resultUpdate = await editGenderSearchSave(message, String(ctx.from?.id), false);

            if (!resultUpdate.status) {
                console.error(resultUpdate.message);
                await ctx.reply('⚠️ Произошла ошибка! Попробуй еще раз');
            }

            return ctx.scene.enter('profileScene');
        } else {
            await ctx.reply('⚠️ Используйте кнопки');
            return
        }
    }
});

export const editGenderSearch = new Scenes.WizardScene<MyContext>('editGenderSearch', async (ctx) => {
    await ctx.reply('Выберете, кого вы хотите искать', {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: 'Мужчин',
                        callback_data: 'false'
                    }
                ],
                [
                    {
                        text: 'Женщин',
                        callback_data: 'true'
                    }
                ]
            ]
        }
    }).then((sendMessage) => {
        ctx.session.sendMessage = sendMessage.message_id;
    });

    return ctx.wizard.next();
}, async (ctx) => {
    if (!ctx.callbackQuery) {
        ctx.reply('⚠️ Используйте кнопки');
        return
    }

    if ("data" in ctx.callbackQuery) {
        const message = ctx.callbackQuery.data;


        const result = await editMessageFromGetAnket(ctx);

        if (!result) {
            console.log('Ошибка в исправлении сообщения!');
        }

        if (message === 'true' || message === 'false') {
            console.log('message', message);
            const resultUpdate = await editGenderSearchSave(message, String(ctx.from?.id), true);

            if (!resultUpdate.status) {
                console.error(resultUpdate.message);
                await ctx.reply('⚠️ Произошла ошибка! Попробуйте еще раз');
            }

            return ctx.scene.enter('profileScene');
        } else {
            await ctx.reply('⚠️ Используйте кнопки');
            return
        }
    }
})

export const editName = new Scenes.WizardScene<MyContext>('editName', async (ctx) => {
    ctx.reply("Введите новое имя");
    return ctx.wizard.next();
}, async (ctx) => {
    if (ctx.message === undefined) {
        ctx.reply('⚠️ Используйте текст!');
        return
    }

    if ("text" in ctx.message) {
        await redis.hset(`user-${ctx.from?.id}`, "name", ctx.message.text);
        const userData = await redis.hgetall(`user-${ctx.from?.id}`);
        const editProfileMessage = await editMessage(userData);

        await ctx.reply('Успешное изменение имени!');
        ctx.replyWithPhoto(userData.photo || '', {
            caption: editProfileMessage,
            parse_mode: "HTML",
            ...buttonSaveAgain
        }).then((sendMessage) => {
            ctx.session.sendMessage = sendMessage.message_id;
        });

        return ctx.wizard.next();
    }
}, async (ctx) => {
    if (!ctx.callbackQuery) {
        ctx.reply('⚠️ Используйте кнопки');
        return
    }

    if ("data" in ctx.callbackQuery) {

        const result = await editMessageFromGetAnket(ctx);

        if (!result) {
            console.log('Ошибка в исправлении сообщения!');
        }

        if (ctx.callbackQuery.data === 'save') {
            SaveEdit(ctx, "name");
        } else if (ctx.callbackQuery.data === 'again') {
            ctx.scene.enter('editName')
            return ctx.scene.leave()
        }
    }
});

export const editDescription = new Scenes.WizardScene<MyContext>('editDescription', async (ctx) => {
    ctx.reply("Введите новое описание");
    return ctx.wizard.next();
}, async (ctx) => {
    if (ctx.message === undefined) {
        ctx.reply('⚠️ Используйте текст!');
        return
    }

    if ("text" in ctx.message) {
        await redis.hset(`user-${ctx.from?.id}`, "description", ctx.message.text);
        const userData = await redis.hgetall(`user-${ctx.from?.id}`);
        const editProfileMessage = await editMessage(userData);

        await ctx.reply('Успешное изменение описания!');
        ctx.replyWithPhoto(userData.photo || '', {
            caption: editProfileMessage,
            parse_mode: "HTML",
            ...buttonSaveAgain
        }).then((sendMessage) => {
            ctx.session.sendMessage = sendMessage.message_id;
        });

        return ctx.wizard.next();
    }
}, async (ctx) => {
    if (!ctx.callbackQuery) {
        ctx.reply('⚠️ Используйте кнопки');
        return
    }

    if ("data" in ctx.callbackQuery) {

        const result = await editMessageFromGetAnket(ctx);

        if (!result) {
            console.log('Ошибка в исправлении сообщения!');
        }

        if (ctx.callbackQuery.data === 'save') {
            SaveEdit(ctx, "description");
        } else if (ctx.callbackQuery.data === 'again') {
            ctx.scene.enter('editDescription')
            return ctx.scene.leave()
        }
    }
});

export const editPhoto = new Scenes.WizardScene<MyContext>('editPhoto', async (ctx) => {
    ctx.reply('Скиньте новую фотографию');
    return ctx.wizard.next();
}, async (ctx) => {
    if (ctx.message === undefined) {
        ctx.reply('⚠️ Вы сделал что-то не то! Запустите /profile и попробуй еще раз');
        return
    }

    if ("photo" in ctx.message) {
        const photo = ctx.message?.photo;

        console.log(photo[0].file_id);
        const fileId = photo[0].file_id

        await redis.hset(`user-${ctx.from?.id}`, "photo", fileId);
        const userData = await redis.hgetall(`user-${ctx.from?.id}`);
        const editProfileMessage = await editMessage(userData);

        await ctx.reply('Успешное изменение фото!');
        ctx.replyWithPhoto(userData.photo || '', {
            caption: editProfileMessage,
            parse_mode: "HTML",
            ...buttonSaveAgain
        }).then((sendMessage) => {
            ctx.session.sendMessage = sendMessage.message_id;
        });

        return ctx.wizard.next();
    }
}, async (ctx) => {
    if (!ctx.callbackQuery) {
        ctx.reply('⚠️ Используйте кнопки');
        return
    }

    if ("data" in ctx.callbackQuery) {
        const result = await editMessageFromGetAnket(ctx);

        if (!result) {
            console.log('Ошибка в исправлении сообщения!');
        }

        if (ctx.callbackQuery.data === 'save') {
            SaveEdit(ctx, "photo");
        } else if (ctx.callbackQuery.data === 'again') {
            ctx.scene.enter('editPhoto')
            return ctx.scene.leave()
        }
    }
});

export const editPhotoInAnket = new Scenes.WizardScene<MyContext>('editPhotoInAnket', async (ctx) => {
    await ctx.reply('Пожалуйста, отправьте фотографию как файл:\n— на мобильном: нажмите «📎» → «Файл» → выберите фото из галереи;\n— на компьютере: отправьте фотографию без сжатия.\nЭто поможет сохранить лучшее качество изображения для вашего профиля.');

    return ctx.wizard.next();
}, async (ctx) => {
    if (!ctx.callbackQuery) {
        if (ctx.message !== undefined) {
            if ('text' in ctx.message) {
                await handleCommand1(ctx);
            }

            if ('document' in ctx.message) {
                const document = ctx.message.document;

                const type_file = document.mime_type

                if (type_file !== 'image/jpeg') {
                    await ctx.reply('Пожалуйста, отправьте файл с расширением .png или .jpeg');

                    return
                }

                await redis.hset(`user-${ctx.from?.id}`, "photoMiniApp", document.file_id);

                const editProfileMessage = 'Все верно?'
                await ctx.sendDocument(document.file_id || '', {
                    caption: editProfileMessage,
                    parse_mode: "HTML",
                    ...buttonSaveAgain
                }).then((sendMessage) => {
                    ctx.session.sendMessage = sendMessage.message_id;
                });

                return ctx.wizard.next();
            }
        }
        return
    }
}, async (ctx) => {
    if (ctx.callbackQuery === undefined) {
        ctx.reply('⚠️ Используйте кнопки');
        return
    }

    if ('data' in ctx.callbackQuery) {
        const result = await editMessageFromGetAnket(ctx);

        if (!result) {
            console.log('Ошибка в исправлении сообщения!');
        }

        if (ctx.callbackQuery.data === 'again') {
            return ctx.scene.enter('editPhotoInAnket');
        } else if (ctx.callbackQuery.data === 'save') {
            SaveEdit(ctx, "photoMiniApp");
        }
    }
})

export const editAge = new Scenes.WizardScene<MyContext>('editAge', async (ctx) => {
    ctx.reply('Введите новый возраст от 0 до 99 лет');
    return ctx.wizard.next();
}, async (ctx) => {
    if (ctx.message === undefined) {
        ctx.reply('⚠️ Используйте текст!');
        return
    }

    if ('text' in ctx.message) {
        const message = ctx.message.text;

        if (!(/^\d{1,2}$/.test(message) && Number(message) >= 0 && Number(message) <= 99)) {
            await ctx.reply('⚠️ Введите свой возраст от 0 до 99 лет');
            return
        }

        await redis.hset(`user-${ctx.from?.id}`, "age", message);
        const userData = await redis.hgetall(`user-${ctx.from?.id}`);
        const editProfileMessage = await editMessage(userData);

        await ctx.reply('Успешное изменение возраста!');
        ctx.replyWithPhoto(userData.photo || '', {
            caption: editProfileMessage,
            parse_mode: "HTML",
            ...buttonSaveAgain
        }).then((sendMessage) => {
            ctx.session.sendMessage = sendMessage.message_id;
        });

        return ctx.wizard.next();
    }
}, async (ctx) => {
    if (ctx.callbackQuery === undefined) {
        ctx.reply('⚠️ Используйте кнопки');
        return
    }

    if ('data' in ctx.callbackQuery) {
        const result = await editMessageFromGetAnket(ctx);

        if (!result) {
            console.log('Ошибка в исправлении сообщения!');
        }

        if (ctx.callbackQuery.data === 'again') {
            ctx.scene.enter('editAge');
            return ctx.scene.leave();
        } else if (ctx.callbackQuery.data === 'save') {
            SaveEdit(ctx, "age");
        }
    }
})

export const editCity = new Scenes.WizardScene<MyContext>('editCity', async (ctx) => {
    ctx.reply('Введите свой город или отправьте свою геолокацию (Скрепка → Локация → Отправить)');
    return ctx.wizard.next();
}, async (ctx) => {
    if (ctx.message === undefined) {
        ctx.reply('⚠️ Используйте текст!');
        return
    }

    try {
        if ('text' in ctx.message) {
            const message = ctx.message.text;

            if (!(/^[a-zA-Zа-яА-ЯёЁ0-9\s-]+$/.test(message) && !/^\d+$/.test(message))) {
                await ctx.reply('⚠️ Назание вашего города не прошло валидации! Попробуйте еще раз');
                return
            }

            await redis.hset(`user-${ctx.from?.id}`, "city", message);
            const userData = await redis.hgetall(`user-${ctx.from?.id}`);
            const editProfileMessage = await editMessage(userData);

            await ctx.reply('Успешное изменение города!');
            ctx.replyWithPhoto(userData.photo || '', {
                caption: editProfileMessage,
                parse_mode: "HTML",
                ...buttonSaveAgain
            }).then((sendMessage) => {
                ctx.session.sendMessage = sendMessage.message_id;
            });

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

            console.log("city", city)

            if (!city) {
                await ctx.reply('Возникла ошибка при получении гео! Попробуйте выбрать ближайший населенный пункт или ввести его название.');
                return
            }

            await redis.hset(`user-${ctx.from?.id}`, "city", city);
            const userData = await redis.hgetall(`user-${ctx.from?.id}`);
            const editProfileMessage = await editMessage(userData);

            await ctx.reply('Успешное изменение города!');
            ctx.replyWithPhoto(userData.photo || '', {
                caption: editProfileMessage,
                parse_mode: "HTML",
                ...buttonSaveAgain
            }).then((sendMessage) => {
                ctx.session.sendMessage = sendMessage.message_id;
            });

            return ctx.wizard.next();
        }
    } catch (err) {
        if (err instanceof Error) {
            console.error('Ошибка в изменении города:', err.message)
        } else {
            console.error('Ошибка в изменении города:', err)
        }

        await ctx.reply('Произошла ошибка! Перезапустите меню изменения и попробуйте еще раз');
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

    if ('data' in ctx.callbackQuery) {
        const result = await editMessageFromGetAnket(ctx);

        if (!result) {
            console.log('Ошибка в исправлении сообщения!');
        }

        if (ctx.callbackQuery.data === 'again') {
            ctx.scene.enter('editCity');
            return ctx.scene.leave();
        } else if (ctx.callbackQuery.data === 'save') {
            SaveEdit(ctx, "city");
            await redis.del(`user-search-${ctx.from?.id}`);
        }
    }
})

export const editStatistics = new Scenes.WizardScene<MyContext>('editStatistics', async (ctx) => {
    const userData = await redis.hgetall(`user-${ctx.from?.id}`);

    console.log("userData", userData);

    await ctx.reply(`
📊 <b>Управление статистикой:</b>
        
1️⃣ <b>Лайки</b> ${userData.likeWieved === '1' ? '(Скрыть)' : '(Открыть)'}  
2️⃣ <b>Дизлайки</b> ${userData.dislikeWieved === '1' ? '(Скрыть)' : '(Открыть)'}  
3️⃣ <b>Коины</b> ${userData.coinWieved === '1' ? '(Скрыть)' : '(Открыть)'}  
        
📌 Выберите действие, нажав на соответствующую кнопку ниже.
`, {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '1', callback_data: 'stat-1' },
                    { text: '2', callback_data: 'stat-2' },
                    { text: '3', callback_data: 'stat-3' }
                ]
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    }).then((sendMessage) => {
        ctx.session.sendMessage = sendMessage.message_id;
    });

    return ctx.wizard.next();
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
        const message = ctx.callbackQuery.data;
        const userData = await redis.hgetall(`user-${ctx.from?.id}`);

        const result = await editMessageFromGetAnket(ctx);

        if (!result) {
            console.log('Ошибка в исправлении сообщения!');
        }

        if (message === 'stat-1') {
            const bool = userData.likeWieved === "1" ? true : false

            const result = await updateStatistics({ like: !bool }, `${ctx.from?.id}`);
            if (result) {
                await ctx.reply(`<b>✅ Успешно!</b> Дизлайк был успешно ${!bool ? 'открыт' : 'скрыт'}.`, { parse_mode: 'HTML' });
            } else {
                await ctx.reply('<b>❌ Ошибка!</b> Произошла ошибка при изменении статистики. Попробуйте еще раз', { parse_mode: 'HTML' });
            }

            ctx.scene.enter('profileScene');
        } else if (message === 'stat-2') {
            const bool = userData.dislikeWieved === "1" ? true : false

            const result = await updateStatistics({ dislike: !bool }, `${ctx.from?.id}`);
            if (result) {
                await ctx.reply(`<b>✅ Успешно!</b> Дизлайк был успешно ${!bool ? 'открыт' : 'скрыт'}.`, { parse_mode: 'HTML' });
            } else {
                await ctx.reply('<b>❌ Ошибка!</b> Произошла ошибка при изменении статистики. Попробуйте еще раз', { parse_mode: 'HTML' });
            }

            ctx.scene.enter('profileScene');
        } else if (message === 'stat-3') {
            const bool = userData.coinWieved === "1" ? true : false

            const result = await updateStatistics({ coin: !bool }, `${ctx.from?.id}`);
            if (result) {
                await ctx.reply(`<b>✅ Успешно!</b> Дизлайк был успешно ${!bool ? 'открыт' : 'скрыт'}.`, { parse_mode: 'HTML' });
            } else {
                await ctx.reply('<b>❌ Ошибка!</b> Произошла ошибка при изменении статистики. Попробуйте еще раз', { parse_mode: 'HTML' });
            }
            await ctx.scene.enter('profileScene');
        }
    }
});

export const editMinMax = new Scenes.WizardScene<MyContext>('editMinMax', async (ctx) => {
    ctx.reply('Введите минмальный возраст поиска');
    return ctx.wizard.next();
}, async (ctx) => {
    if (ctx.message === undefined) {
        ctx.reply('⚠️ Используйте текст!');
        return
    }
    if ('text' in ctx.message) {
        const message = ctx.message.text;

        if (!(/^\d{1,2}$/.test(message) && Number(message) >= 0 && Number(message) <= 99)) {
            await ctx.reply('⚠️ Введите возраст от 0 до 99 лет');
            return
        }

        await redis.hset(`user-${ctx.from?.id}`, "minAge", message);
        ctx.reply('Введите максимальный возраст поиска');
        return ctx.wizard.next();
    }

}, async (ctx) => {
    if (ctx.message === undefined) {
        ctx.reply('⚠️ Используйте текст!');
        return
    }
    if ('text' in ctx.message) {
        const message = ctx.message.text;

        if (!(/^\d{1,2}$/.test(message) && Number(message) >= 0 && Number(message) <= 99)) {
            await ctx.reply('⚠️ Введите возраст от 0 до 99 лет');
            return
        }

        await redis.hset(`user-${ctx.from?.id}`, "maxAge", message);
        const userData = await redis.hgetall(`user-${ctx.from?.id}`);
        const editProfileMessage = await editMessage(userData);

        await ctx.reply('Успешное изменение минимального и максимального возраста!');
        ctx.replyWithPhoto(userData.photo || '', {
            caption: editProfileMessage,
            parse_mode: "HTML",
            ...buttonSaveAgain
        }).then((sendMessage) => {
            ctx.session.sendMessage = sendMessage.message_id;
        });
        return ctx.wizard.next();
    }

}, async (ctx) => {
    if (ctx.callbackQuery === undefined) {
        ctx.reply('⚠️ Необходимо использовать кнопки');
        return
    }

    if ('data' in ctx.callbackQuery) {
        const result = await editMessageFromGetAnket(ctx);

        if (!result) {
            console.log('Ошибка в исправлении сообщения!');
        }

        if (ctx.callbackQuery.data === 'again') {
            ctx.scene.enter('editMinMax');
            return ctx.scene.leave();
        } else if (ctx.callbackQuery.data === 'save') {
            try {
                const url = process.env.URL;
                const urlPath = `${url}/users/${ctx.from?.id}`;
                const userData = await redis.hgetall(`user-${ctx.from?.id}`);
                const body = { ageMinMax: { minAge: Number(userData.minAge), maxAge: Number(userData.maxAge) } };

                const req = await axios.patch(urlPath, body);

                if (req.status === 400) {
                    throw new Error(JSON.stringify(req.data) + req.status)
                }

                await ctx.reply('Успешное изменение юзера!', buttonNav);
                await ctx.scene.enter('profileScene');
                await redis.del(`user-search-${ctx.from?.id}`);
                return ctx.scene.leave()
            } catch (err) {
                if (err instanceof Error) {
                    console.error(err.message);
                }
                await ctx.reply('Произошла ошибка! Перезапустите меню изменения и попробуйте еще раз');
                return ctx.wizard.next()
            }
        }
    }
})

export const refreshScene = new Scenes.WizardScene<MyContext>('refreshScene', async (ctx) => {
    await ctx.reply('Как вас зовут?');
    return ctx.wizard.next();
}, async (ctx) => {
    if (ctx.message === undefined) {
        ctx.reply('⚠️ Ты сделал что-то не то! Запусти /profile и попробуй еще раз');
        return
    }

    if ("text" in ctx.message) {
        const message = ctx.message?.text;

        await redis.hset(`user-${ctx.from?.id}`, "name", message);

        ctx.reply('Теперь измените описание')
        return ctx.wizard.next();
    }
}, async (ctx) => {
    if (ctx.message === undefined) {
        ctx.reply('⚠️ Вы сделали что-то не то! Запустите /profile и попробуйте еще раз');
        return
    }

    if ("text" in ctx.message) {
        const message = ctx.message?.text;

        await redis.hset(`user-${ctx.from?.id}`, "description", message);

        ctx.reply('Теперь измените свой город или отправьте свою геолокацию (Скрепка → Локация → Отправить)');
        return ctx.wizard.next();
    }
}, async (ctx) => {
    if (ctx.message === undefined) {
        ctx.reply('⚠️ Ты сделал что-то не то! Запусти /profile и попробуй еще раз');
        return
    }

    if ("text" in ctx.message) {
        const message = ctx.message?.text;

        if (!(/^[a-zA-Zа-яА-ЯёЁ0-9\s-]+$/.test(message) && !/^\d+$/.test(message))) {
            await ctx.reply('⚠️ Назание вашего города не прошло валидации! Попробуйте еще раз');
            return
        }

        await redis.hset(`user-${ctx.from?.id}`, "city", message);

        await ctx.reply('Ваг город изменен! Теперь измените свой возраст')
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

        await redis.hset(`user-${ctx.from?.id}`, "city", city);

        await ctx.reply('Теперь измените свой возраст')
        return ctx.wizard.next();
    }
}, async (ctx) => {
    if (ctx.message === undefined) {
        ctx.reply('⚠️ Вы сделали что-то не то! Запустите /profile и попробуйте еще раз');
        return
    }

    if ("text" in ctx.message) {
        const message = ctx.message?.text;

        if (!(/^\d{1,2}$/.test(message) && Number(message) >= 0 && Number(message) <= 99)) {
            await ctx.reply('⚠️ Введите возраст от 0 до 99 лет');
            return
        }

        await redis.hset(`user-${ctx.from?.id}`, "age", message);

        ctx.reply('Теперь измените свою фотографию')
        return ctx.wizard.next();
    }
}, async (ctx) => {
    if (ctx.message === undefined) {
        ctx.reply('⚠️ Ты сделал что-то не то! Запусти /profile и попробуй еще раз');
        return
    }

    if ("photo" in ctx.message) {
        const photo = ctx.message?.photo;

        console.log(photo[0].file_id);
        const fileId = photo[0].file_id

        await redis.hset(`user-${ctx.from?.id}`, "photo", fileId);

        const userData = await redis.hgetall(`user-${ctx.from?.id}`);
        const editProfileMessage = await editMessage(userData);

        await ctx.reply('Ваша измененая анкета. Отдельно вы можете изменить максимальный и минимальный возраст анкет');
        ctx.replyWithPhoto(userData.photo || '', {
            caption: editProfileMessage,
            parse_mode: "HTML",
            ...buttonSaveAgain
        }).then((sendMessage) => {
            ctx.session.sendMessage = sendMessage.message_id;
        });
        return ctx.wizard.next();
    }
}, async (ctx) => {
    if (!ctx.callbackQuery) {
        ctx.reply('⚠️ Используйте кнопки!')
        return
    }

    if ("data" in ctx.callbackQuery) {
        const result = await editMessageFromGetAnket(ctx);

        if (!result) {
            console.log('Ошибка в исправлении сообщения!');
        }

        if (ctx.callbackQuery.data === 'save') {
            try {
                const userData = await redis.hgetall(`user-${ctx.from?.id}`);

                const body = {
                    name: userData.name,
                    description: userData.description,
                    photo: userData.photo,
                    city: userData.city,
                    age: Number(userData.age)
                }

                const url = process.env.URL;
                const urlPut = `${url}/users/${ctx.from?.id}`;

                const req = await axios.put(urlPut, body);

                if (req.status === 400) {
                    throw new Error(`${JSON.stringify(req.data)}`)
                }
                await ctx.scene.enter('profileScene');
                await redis.del(`user-search-${ctx.from?.id}`);
                return ctx.scene.leave();
            } catch (err) {
                if (err instanceof Error) {
                    console.error(err.message);
                }
                console.error(err);
                ctx.reply(`Error: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
            }
        } else if (ctx.callbackQuery.data === 'again') {
            ctx.scene.enter('refreshScene');
            return ctx.scene.leave()
        }
    }
});

export const premiumSceneProfile = new Scenes.WizardScene<MyContext>('premiumSceneProfile', async (ctx) => {
    if (!ctx.callbackQuery) {
        if (ctx.message !== undefined) {
            if ('text' in ctx.message) {
                await handleCommand1(ctx);
            }
        }
        return
    }

    const editMessage = await editMessageOnlyText(ctx,
        `
<b>💎 Премиум за звезды! 💎</b>  
        
🔥 Станьте обладателем <b>⭐ PREMIUM ⭐</b> и получите уникальные преимущества:  
        
1️⃣ 🔍 <b>Без ограничений:</b> Ищите анкеты без лимитов!  
2️⃣ 🛡️ <b>Скрывайте характеристики:</b> Управляйте отображением лайков и дизлайков.  
3️⃣ 🌟 <b>Эксклюзивная отметка:</b> Ваша анкета будет выделена <b>⭐ PREMIUM ⭐</b> вместо стандартного 💘.  
4️⃣ 🚀 <b>Приоритет в поиске:</b> Ваша анкета будет показываться первой и попадаться в 5 раз чаще!  
`, {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: '⭐ Купить премиум на день 250 звезд',
                        callback_data: 'prem_250'
                    }
                ],
                [
                    {
                        text: '⭐ Купить премиум на неделю 500 звезд',
                        callback_data: 'prem_500'
                    }
                ],
                [
                    {
                        text: '⭐ Купить премиум на месяц 800 звезд',
                        callback_data: 'prem_800'
                    }
                ],
                [
                    {
                        text: '⭐ Купить премиум на день 8,000 звезд',
                        callback_data: 'prem_8000'
                    }
                ],
                [
                    {
                        text: '💎 Купить премиум за 35,000 гемов',
                        callback_data: 'prem_35000_gems'
                    }
                ],
                [
                    {
                        text: 'Вернуться назад',
                        callback_data: 'exit',
                    }
                ]
            ]
        }
    });

    if (!editMessage) {
        await ctx.reply('⚠️ Произошла ошибка! Попробуйте еще раз.');
        return
    }

    ctx.session.exitGems = false

    return ctx.wizard.next();

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

        const message = ctx.callbackQuery.data;

        switch (message) {
            case 'prem_250':
                await Payments(ctx, 250, 1);
                break
            case 'prem_500':
                await Payments(ctx, 500, 7);
                break
            case 'prem_800':
                await Payments(ctx, 800, 30);
                break
            case 'prem_8000':
                await Payments(ctx, 8000, 365);
                break
            case 'prem_35000_gems':
                try {
                    const url = process.env.URL;

                    const updateUserGems = await axios.put(`${url}/users/${ctx.from?.id}/gems`, {
                        action: 'decrement',
                        count: 35000
                    }, {
                        validateStatus: () => true
                    });

                    if (updateUserGems.status === 400) {
                        throw new Error(JSON.stringify(updateUserGems.data.message));
                    }

                    const updateUserPremium = await axios.put(`${url}/users/${ctx.from?.id}/premium`, {
                        premium: true,
                        days: 1
                    })

                    if (updateUserPremium.status === 400) {
                        throw new Error(JSON.stringify(updateUserPremium.data));
                    }

                    await ctx.reply(`
            🎉 <b>Поздравляем!</b> Вы стали обладателем ⭐ <b>PREMIUM</b> ⭐ на 1 день!`, {
                        parse_mode: 'HTML'
                    });

                    return ctx.scene.enter('profileScene');
                } catch (err) {
                    if (err instanceof Error) {
                        console.error(err.message)
                    } else {
                        console.error(err)
                    }

                    await ctx.reply('Произошла ошибка! Проверьте свой счет.')
                }
            case 'exit':
                ctx.session.exitGems = true;

                return ctx.scene.enter('shopScene');

            default:
                ctx.reply('Ошибка! Попробуйте еще раз')
                break
        }

        return ctx.scene.leave();
    }
});

export const caseScene = new Scenes.WizardScene<MyContext>('caseScene', async (ctx) => {

    const url = process.env.URL;

    const req = await axios.get(`${url}/users/${ctx.from?.id}`);

    if (req.status === 400) {
        throw new Error(`Ошибка: ${JSON.stringify(req.data.message)}`);
    }

    const user = req.data.message;

    await redis.hset(`case-${ctx.from?.id}`, {
        caseBronza: user.caseBronza,
        caseSilver: user.caseSilver,
        caseGold: user.caseGold,
        casePlatinum: user.casePlatinum,
        caseMystery: user.caseMystery,
        caseEveryDay: user.caseEveryDay,
    });

    await redis.expire(`case-${ctx.from?.id}`, 600);

    const casesRedis = await redis.hgetall(`case-${ctx.from?.id}`);

    if (ctx.session.exitGems) {
        ctx.session.exitGems = false

        const editMessage = await editMessageOnlyText(ctx,
            `<b>📦 Достурные кейсы:</b>\n\n` +
            `1️⃣ <b>Бесплатный кейс</b> [${casesRedis.caseEveryDay}]\n` +
            `2️⃣ <b>Бронзовый кейс</b> [${casesRedis.caseBronza}] \n` +
            `3️⃣ <b>Серебренный кейс</b> [${casesRedis.caseSilver}]\n` +
            `4️⃣ <b>Золотой кейс</b> [${casesRedis.caseGold}]\n` +
            `5️⃣ <b>Платиновый кейс</b> [${casesRedis.casePlatinum}]\n` +
            `6️⃣ <b>Мистический кейс</b> [${casesRedis.caseMystery}]\n` +
            `7️⃣ <b>Магазин кейсов</b>\n\n` +
            `📌 Выберите действие, нажав на соответствующую кнопку ниже.`, {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: '1',
                            callback_data: '1-case'
                        },
                        {
                            text: '2',
                            callback_data: '2-case'
                        },
                        {
                            text: '3',
                            callback_data: '3-case'
                        },
                        {
                            text: '4',
                            callback_data: '4-case'
                        },
                    ],
                    [
                        {
                            text: '5',
                            callback_data: '5-case'
                        },
                        {
                            text: '6',
                            callback_data: '6-case'
                        },
                        {
                            text: '7',
                            callback_data: '7-case'
                        }
                    ]
                ],
                resize_keyboard: true,
                one_time_keyboard: false
            }
        });

        if (!editMessage) {
            await ctx.reply('⚠️ Произошла ошибка! Попробуйте еще раз.');
            return
        }

        return ctx.wizard.next();
    }

    await ctx.reply(
        `<b>📦 Достурные кейсы:</b>\n\n` +
        `1️⃣ <b>Бесплатный кейс</b> [${casesRedis.caseEveryDay}]\n` +
        `2️⃣ <b>Бронзовый кейс</b> [${casesRedis.caseBronza}] \n` +
        `3️⃣ <b>Серебренный кейс</b> [${casesRedis.caseSilver}]\n` +
        `4️⃣ <b>Золотой кейс</b> [${casesRedis.caseGold}]\n` +
        `5️⃣ <b>Платиновый кейс</b> [${casesRedis.casePlatinum}]\n` +
        `6️⃣ <b>Мистический кейс</b> [${casesRedis.caseMystery}]\n` +
        `7️⃣ <b>Магазин кейсов</b>\n\n` +
        `📌 Выберите действие, нажав на соответствующую кнопку ниже.`,
        {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: '1',
                            callback_data: '1-case'
                        },
                        {
                            text: '2',
                            callback_data: '2-case'
                        },
                        {
                            text: '3',
                            callback_data: '3-case'
                        },
                        {
                            text: '4',
                            callback_data: '4-case'
                        },
                    ],
                    [
                        {
                            text: '5',
                            callback_data: '5-case'
                        },
                        {
                            text: '6',
                            callback_data: '6-case'
                        },
                        {
                            text: '7',
                            callback_data: '7-case'
                        }
                    ]
                ],
                resize_keyboard: true,
                one_time_keyboard: false
            }
        }
    ).then((sendMessage) => {
        ctx.session.sendMessage = sendMessage.message_id;
    });

    return ctx.wizard.next();
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
            case '1-case':
                await ctx.scene.enter('caseEveryDayScene');
                break

            case '2-case':
                await ctx.scene.enter('caseBronzaScene');
                break

            case '3-case':
                await ctx.scene.enter('caseSilverScene');
                break

            case '4-case':
                await ctx.scene.enter('caseGoldScene');
                break

            case '5-case':
                await ctx.scene.enter('casePlatinumScene');
                break

            case '6-case':
                await ctx.scene.enter('caseMysteryScene');
                break

            case '7-case':
                await ctx.scene.enter('caseShopScene');
                break

            default:
                break
        }
    }
});

export const referalScene = new Scenes.WizardScene<MyContext>('referalScene', async (ctx) => {
    await ctx.reply(
        `🎉 <b>Награды за рефералку!</b>\n\n` +
        `Когда вы пригласите друга, вы оба получите замечательные награды! 🏆\n\n` +
        `💠 <b>Вы получаете:</b>\n` +
        `• 7,500 <b>гемов</b>\n` +
        `• 1 <b>Мистический кейс</b>\n` +
        `• 1 <b>Золотой кейс</b>\n\n` +
        `🎁 <b>Ваш друг получает:</b>\n` +
        `• 5,000 <b>гемов</b>\n` +
        `• 1 <b>Мистический кейс</b>\n` +
        `• 1 <b>Бронзовый кейс</b>\n\n` +
        `Приглашайте друзей и получайте уникальные награды! 🎉\n\n` +
        `👉 <b>Ссылка для приглашения:</b> https://t.me/nexycon_bot?start=${ctx.from?.id}`,
        {
            parse_mode: 'HTML'
        }
    );

    return ctx.wizard.next();
}, async (ctx) => {
    if (!ctx.callbackQuery) {
        if (ctx.message !== undefined) {
            if ('text' in ctx.message) {
                await handleCommand1(ctx);
            }
        }
        return
    }
});

export const shopScene = new Scenes.WizardScene<MyContext>('shopScene', async (ctx) => {
    if (ctx.session.exitGems) {
        const editMessage = await editMessageOnlyText(ctx,
            `<b>🛒 Магазин</b>\n\n` +
            `1️⃣ <b>Гемы</b> — используйте для покупки кейсов и повышения места в топе.\n` +
            `2️⃣ <b>Премиум</b> — получите эксклюзивные функции и привилегии.\n` +
            `3️⃣ <b>Кейсы</b> — шанс выиграть еще больше гемов!\n\n` +
            `📌 Выберите товар, нажав на соответствующую кнопку ниже.`, {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: '1',
                            callback_data: '1-shop'
                        },
                        {
                            text: '2',
                            callback_data: '2-shop'
                        },
                        {
                            text: '3',
                            callback_data: '3-shop'
                        }
                    ]
                ]
            }
        });

        if (!editMessage) {
            await ctx.reply('⚠️ Произошла ошибка! Попробуйте еще раз.');
            return
        }

        return ctx.wizard.next();
    }

    await ctx.reply(
        `<b>🛒 Магазин</b>\n\n` +
        `1️⃣ <b>Гемы</b> — используйте для покупки кейсов и повышения места в топе.\n` +
        `2️⃣ <b>Премиум</b> — получите эксклюзивные функции и привилегии.\n` +
        `3️⃣ <b>Кейсы</b> — шанс выиграть еще больше гемов!\n\n` +
        `📌 Выберите товар, нажав на соответствующую кнопку ниже.`,
        {
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: '1',
                            callback_data: '1-shop'
                        },
                        {
                            text: '2',
                            callback_data: '2-shop'
                        },
                        {
                            text: '3',
                            callback_data: '3-shop'
                        }
                    ]
                ]
            }
        }
    ).then((sendMessage) => {
        ctx.session.sendMessage = sendMessage.message_id;
    });

    return ctx.wizard.next();
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
            case '1-shop':
                return ctx.scene.enter('gemsShop');
            case '2-shop':
                return ctx.scene.enter('premiumSceneProfile');
            case '3-shop':
                ctx.session.shop = true;
                return ctx.scene.enter('caseShopScene');
            default:
                await ctx.reply('⚠️ Используйте кнопки!');
                return;
        }
    }
});

export const gemsShop = new Scenes.WizardScene<MyContext>('gemsShop', async (ctx) => {
    if (!ctx.callbackQuery) {
        if (ctx.message !== undefined) {
            if ('text' in ctx.message) {
                await handleCommand1(ctx);
            }
        }
        return
    }

    const editMessage = await editMessageOnlyText(ctx,
        `<b>💠 Магазин гемов</b>\n\n` +
        `🔹 Здесь вы можете <b>купить гемы за звезды</b>.\n\n` +
        `📌 Чем больше покупка, тем <b>выгоднее цена!</b>\n\n` +
        `⬇️ Выберите нужное количество ниже:`, {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: '💠 Купить 10,000 гемов — 50 звезд',
                        callback_data: 'gems_10k'
                    }
                ],
                [
                    {
                        text: '💠 Купить 100,000 гемов — 450 звезд',
                        callback_data: 'gems_100k'
                    }
                ],
                [
                    {
                        text: '💠 Купить 500,000 гемов — 1,800 звезд',
                        callback_data: 'gems_500k'
                    }
                ],
                [
                    {
                        text: '💠 Купить 1,000,000 гемов — 3,200 звезд',
                        callback_data: 'gems_1m'
                    }
                ],
                [
                    {
                        text: 'Вернуться назад',
                        callback_data: 'exit',
                    }
                ]
            ]
        }
    });

    if (!editMessage) {
        await ctx.reply('⚠️ Произошла ошибка! Попробуйте еще раз.');
        return
    }

    ctx.session.exitGems = false

    return ctx.wizard.next();
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

        const message = ctx.callbackQuery.data;

        switch (message) {
            case 'gems_10k':
                await PaymentsGems(ctx, 50, 10000);
                break
            case 'gems_100k':
                await PaymentsGems(ctx, 450, 100000);
                break
            case 'gems_500k':
                await PaymentsGems(ctx, 1800, 500000);
                break
            case 'gems_1m':
                await PaymentsGems(ctx, 3200, 1000000);
                break
            case 'exit':
                ctx.session.exitGems = true;

                return ctx.scene.enter('shopScene')
            default:
                ctx.reply('Ошибка! Попробйте еще раз')
                break
        }

        return ctx.scene.leave();
    }
})

const SaveEdit = async (ctx: MyContext, inputName: string) => {
    try {
        const url = process.env.URL;
        const urlPath = `${url}/users/${ctx.from?.id}`;
        const inputNameObj = await redis.hget(`user-${ctx.from?.id}`, inputName);
        const body = { [inputName]: inputNameObj };

        const req = await axios.patch(urlPath, body);

        if (req.status === 400) {
            throw new Error(JSON.stringify(req.data) + req.status)
        }

        await ctx.scene.enter('profileScene');
    } catch (err) {
        if (err instanceof Error) {
            console.error(err.message);
        }
        ctx.reply(`${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
    }
}

const updateStatistics = async (data: BodyStatistics, id: string) => {
    try {
        const url = process.env.URL;

        const req = await axios.patch(`${url}/users/${id}/statistics`, data);

        if (req.status === 400) {
            throw new Error(JSON.stringify(req.data.message));
        }

        return true
    } catch (err) {
        console.error(err);
        return false
    }
}

const editMessage = async (userData: any) => {
    return `
<b>${userData.premium === "1" ? '⭐ PREMIUM ⭐' : '💘 Анкета пользователя'}</b>  
———————————————  
👤 <b>Имя:</b> ${userData.name}  
🎂 <b>Возраст:</b> ${userData.age}  
📍 <b>Город:</b> ${userData.city}  
📖 <b>Описание:</b> ${userData.description}
🎯<b>Возрастной диапазон:</b> ${userData.minAge} - ${userData.maxAge}      
`;

}

const editGenderSearchSave = async (gender: string, id: string, search: boolean) => {
    const url = process.env.URL;
    let bodyGender;

    if (gender === "true") {
        bodyGender = true
    } else if (gender === "false") {
        bodyGender = false
    }

    let urlGender;

    if (search) {
        urlGender = `${url}/users/${id}/gender/search`
    } else {
        urlGender = `${url}/users/${id}/gender`
    }

    try {
        const req = await axios.put(urlGender, {
            gender: bodyGender
        }, {
            validateStatus: () => true
        });

        if (req.status === 400) {
            throw new Error(JSON.stringify(req.data.message));
        }

        return { status: true }
    } catch (err) {
        let errMessage;
        if (err instanceof Error) {
            console.error(err.message);
            errMessage = err.message
        } else {
            console.error(err);
            errMessage = err
        }

        return { message: errMessage, status: false }
    }
}

export const sendGems = new Scenes.WizardScene<MyContext>('sendGems', async (ctx: any) => {
    if (ctx.session.exitGems) {
        console.log("work");
        ctx.wizard.selectStep(1);
        return ctx.wizard.steps[1](ctx);
    }

    await ctx.reply(`💠 <b>Перевод гемов</b>\n\n` +
        `🔹 Введите <b>ID</b> пользователя, которому хотите отправить гемы.\n`, {
        parse_mode: 'HTML'
    });


    return ctx.wizard.next();
}, async (ctx) => {
    console.log('nextWizard');

    if (ctx.session.exitGems) {

        const url = process.env.URL
        const req = await axios.get(`${url}/users/${ctx.from?.id}`, {
            validateStatus: () => true
        });

        if (req.status === 400) {
            await ctx.reply('⚠️ Произошла ошибка! Перезапустите отправку гемов и попробуйте еще раз.');
            return
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

        const userCheck = await axios.get(`${url}/users/${ctx.session.sendGemsId}`);

        const user = userCheck.data.message;

        const iconsTop = getTopIcon(user.top);
        const formatNumberCoin = formatNumber(user.coin);

        const profileMessage = `  
<b>${user.premium ? '⭐ PREMIUM ⭐' : '💘 Анкета пользователя'}</b>
${iconsTop} <b>Место в топе:</b> ${user.top}
———————————————  
${user.gender ? '👱🏻‍♀️' : '👱🏻'} <b>Имя:</b> ${user.name}  
🎂 <b>Возраст:</b> ${user.age}  
📍 <b>Город:</b> ${user.city}  
📖 <b>Описание:</b> ${user.description}  
———————————————  
💠 <b>Гемы:</b> ${formatNumberCoin}  
———————————————
Сколько гемов вы хотите отправить?
`;
        const editMessage = await editMessageMorGems(ctx, profileMessage, {
            reply_markup: {
                inline_keyboard: [
                    ...keyboard,
                    [
                        {
                            text: 'Ввести своё количество',
                            callback_data: 'send_custom_amount'
                        }
                    ]
                ]
            }
        });

        if (!editMessage) {
            await ctx.reply('⚠️ Произошла ошибка! Перезапусти поиск и попробуй еще раз.');
            return
        }

        ctx.session.exitGems = false

        return ctx.wizard.next();
    }

    if (!ctx.callbackQuery) {
        if (ctx.message !== undefined) {
            if ('text' in ctx.message) {
                const message = ctx.message?.text;

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
                        const url = process.env.URL
                        const req = await axios.get(`${url}/users/${ctx.from?.id}`, {
                            validateStatus: () => true
                        });

                        if (req.status === 400) {
                            await ctx.reply('⚠️ Произошла ошибка! Перезапустите отправку гемов и попробуйте еще раз.');
                            return
                        }

                        if (!/^\d+$/.test(message)) {
                            await ctx.reply('❌ <b>Неверный ID</b>\n\nID пользователя должен содержать <u>только цифры</u>, без букв и символов.', {
                                parse_mode: 'HTML'
                            });
                            return;
                        }


                        const userCheck = await axios.get(`${url}/users/${message}`);

                        if (userCheck.status === 400) {
                            await ctx.reply('❌ <b>Пользователь не найден</b>\n\nПроверьте введённый <u>ID</u> — такого пользователя не существует.', {
                                parse_mode: 'HTML'
                            });

                            return;
                        }

                        const coins = req.data.message.coin

                        if (coins < 100) {
                            await ctx.reply('🚫 Недостаточно гемов для перевода! Вы можете перевести минимум 100 гемов.');
                            return ctx.scene.enter('profileScene')
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

                        const user = userCheck.data.message;

                        const iconsTop = getTopIcon(user.top);
                        const formatNumberCoin = formatNumber(user.coin);

                        const profileMessage = `  
<b>${user.premium ? '⭐ PREMIUM ⭐' : '💘 Анкета пользователя'}</b>
${iconsTop} <b>Место в топе:</b> ${user.top}
———————————————  
${user.gender ? '👱🏻‍♀️' : '👱🏻'} <b>Имя:</b> ${user.name}  
🎂 <b>Возраст:</b> ${user.age}  
📍 <b>Город:</b> ${user.city}  
📖 <b>Описание:</b> ${user.description}  
———————————————  
💠 <b>Гемы:</b> ${formatNumberCoin}  
———————————————
Сколько гемов вы хотите отправить?
`;

                        await ctx.replyWithPhoto(user.photo.trim() || '', {
                            caption: profileMessage,
                            parse_mode: "HTML",
                            reply_markup: {
                                inline_keyboard: [
                                    ...keyboard,
                                    [
                                        {
                                            text: 'Ввести своё количество',
                                            callback_data: 'send_custom_amount'
                                        }
                                    ]
                                ]
                            }
                        }).then((sendMessage) => {
                            ctx.session.sendMessage = sendMessage.message_id;
                        });;

                        ctx.session.sendGemsId = user.id;

                        return ctx.wizard.next()
                }
            }
        }
        return
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

    if ('data' in ctx.callbackQuery) {
        const message = ctx.callbackQuery.data;

        if (message === 'send_custom_amount') {
            return ctx.scene.enter('sendGemsCustom');
        } else if (message.startsWith('send_')) {
            const parts = message.split('_');
            const value = Number(parts[1]);
            const url = process.env.URL;
            try {
                const reqCoin = await axios.put(`${url}/match/coin/${ctx.from?.id}/${ctx.session.sendGemsId}`,
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

                const result = await editMessageFromGetAnket(ctx);

                if (!result) {
                    await ctx.reply('⚠️ Произошла ошибка! Попробуйте еще раз');
                }

                try {
                    const reqMessage = await axios.post(`https://api.telegram.org/bot${process.env.TELEG_TOKEN}/sendMessage`, {
                        chat_id: ctx.session.sendGemsId,
                        text: `<b>🎁 Перевод гемов</b>\n\nПользователь с ID <code>${ctx.from?.id}</code> отправил вам <b>${value} 💠</b>!`,
                        parse_mode: "HTML"
                    }, {
                        validateStatus: () => true
                    });


                    if (reqMessage.status === 400) {
                        throw new Error(JSON.stringify(reqMessage.data));
                    }
                } catch (err) {
                    if (err instanceof Error) {
                        console.error('Ошибка при отправке гемов' + err.message)
                    } else {
                        console.error('Неизвестная ошибка при отправке гемов' + err)
                    }
                }


                return ctx.scene.enter('profileScene')
            } catch (err) {
                if (err instanceof Error) {
                    console.error('Ошибка при отправке гемов' + err.message)
                } else {
                    console.error('Неизвестная ошибка при отправке гемов' + err)
                }

                await ctx.reply('⚠️ Произошла ошибка! Попробуйте еще раз')
            }

        }
    }
});

export const sendGemsCustom = new Scenes.WizardScene<MyContext>('sendGemsCustom', async (ctx) => {
    if (!ctx.callbackQuery) {
        if (ctx.message !== undefined) {
            if ('text' in ctx.message) {
                await handleCommand1(ctx);
            }
        }
        return
    }

    const editMessage = await editMessageMorGems(ctx, 'Введите количество гемов, которое вы хотите отправить пользователю.\n\nЕсли хотите отправить весь баланс — нажмите кнопку ниже', {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: 'Отправить все гемы',
                        callback_data: 'send_all'
                    }
                ],
                [
                    {
                        text: 'Назад',
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
}, async (ctx) => {
    if (!ctx.callbackQuery) {
        if (ctx.message !== undefined) {
            if ('text' in ctx.message) {
                if (!/^\d+$/.test(ctx.message.text)) {
                    await ctx.reply(
                        '❌ <b>Неверное значение</b>\n\nВведите <u>только число</u> — без букв, пробелов и символов.\nНапример: <code>500</code>',
                        { parse_mode: 'HTML' }
                    );
                    return;
                }


                const value = Number(ctx.message.text);

                if (value < 100) {
                    await ctx.reply(
                        '🚫 <b>Минимальное количество для перевода</b> составляет <b>100 гемов</b>.\n\n' +
                        'Введите <b>число больше 100</b>, чтобы продолжить.',
                        { parse_mode: 'HTML' }
                    );

                    return
                }


                try {
                    const url = process.env.URL;

                    const reqCoin = await axios.put(`${url}/match/coin/${ctx.from?.id}/${ctx.session.sendGemsId}`,
                        {
                            count: value
                        },
                        {
                            validateStatus: () => true
                        }
                    );

                    if (reqCoin.status === 401) {
                        console.log(reqCoin.data.message)
                        await ctx.reply(
                            '🚫 <b>Недостаточно гемов!</b>\n\n' +
                            'Попробуйте перевести меньшее количество.',
                            { parse_mode: 'HTML' }
                        );

                        return ctx.scene.enter('profileScene')
                    }

                    if (reqCoin.status === 400) {
                        throw new Error(JSON.stringify(reqCoin.data.message));
                    }

                    const result = await editMessageFromGetAnket(ctx);

                    if (!result) {
                        await ctx.reply('⚠️ Произошла ошибка! Попробуйте еще раз');
                    }

                    try {
                        const reqMessage = await axios.post(`https://api.telegram.org/bot${process.env.TELEG_TOKEN}/sendMessage`, {
                            chat_id: ctx.session.sendGemsId,
                            text: `<b>🎁 Перевод гемов</b>\n\nПользователь с ID <code>${ctx.from?.id}</code> отправил вам <b>${value} 💠</b>!`,
                            parse_mode: "HTML"
                        }, {
                            validateStatus: () => true
                        });


                        if (reqMessage.status === 400) {
                            throw new Error(JSON.stringify(reqMessage.data));
                        }
                    } catch (err) {
                        if (err instanceof Error) {
                            console.error('Ошибка при отправке гемов' + err.message)
                        } else {
                            console.error('Неизвестная ошибка при отправке гемов' + err)
                        }
                    }

                    return ctx.scene.enter('profileScene')
                } catch (err) {
                    if (err instanceof Error) {
                        console.error('Ошибка при отправке гемов' + err.message)
                    } else {
                        console.error('Неизвестная ошибка при отправке гемов' + err)
                    }

                    await ctx.reply('⚠️ Произошла ошибка! Попробуйте еще раз');
                    return
                }
            }
        }
        return
    }

    if ('data' in ctx.callbackQuery) {
        const message = ctx.callbackQuery.data;

        if (message === 'send_all') {
            const editMessage = await editMessageMorGems(ctx, '<b>Вы уверены, что хотите отправить все свои гемы?</b>', {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: 'Отправить все',
                                callback_data: 'yes'
                            }
                        ],
                        [
                            {
                                text: 'Вернуться назад',
                                callback_data: 'no'
                            }
                        ]
                    ]
                }
            });

            if (!editMessage) {
                await ctx.reply('⚠️ Произошла ошибка! попробуйте еще раз.');
                return
            }

            return ctx.wizard.next();
        } else if (message === 'exit') {
            ctx.session.exitGems = true
            return ctx.scene.enter('sendGems')
        }
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

    if ('data' in ctx.callbackQuery) {
        const message = ctx.callbackQuery.data;

        if (message === 'no') {
            return ctx.scene.enter('sendGemsCustom')
        } else if (message === 'yes') {
            const url = process.env.URL;

            const req = await axios.get(`${url}/users/${ctx.from?.id}`, {
                validateStatus: () => true
            });

            if (req.status === 400) {
                await ctx.reply('⚠️ Произошла ошибка! Перезапустите отправку гемов и попробуйте еще раз.');
                return
            }

            const value = req.data.message.coin

            const result2 = await sendGemsFuction(value, ctx);

            if (!result2.status) {
                console.error(result2?.message);
                return
            }

            return ctx.scene.enter('profileScene')
        } else {
            await ctx.reply('⚠️ Произошла ошибка! Вы нажали что-то не то.')
        }
    }
})


const sendGemsFuction = async (value: number, ctx: any) => {
    try {
        const url = process.env.URL;

        const reqCoin = await axios.put(`${url}/match/coin/${ctx.from?.id}/${ctx.session.sendGemsId}`,
            {
                count: value
            },
            {
                validateStatus: () => true
            }
        );

        if (reqCoin.status === 400) {
            throw new Error(JSON.stringify(reqCoin.data.message));
        }

        const result = await editMessageFromGetAnket(ctx);

        if (!result) {
            await ctx.reply('⚠️ Произошла ошибка! Попробуйте еще раз');
        }

        try {
            const reqMessage = await axios.post(`https://api.telegram.org/bot${process.env.TELEG_TOKEN}/sendMessage`, {
                chat_id: ctx.session.sendGemsId,
                text: `<b>🎁 Перевод гемов</b>\n\nПользователь с ID <code>${ctx.from?.id}</code> отправил вам <b>${value} 💠</b>!`,
                parse_mode: "HTML"
            }, {
                validateStatus: () => true
            });


            if (reqMessage.status === 400) {
                throw new Error(JSON.stringify(reqMessage.data));
            }
        } catch (err) {
            if (err instanceof Error) {
                console.error('Ошибка при отправке гемов' + err.message)
            } else {
                console.error('Неизвестная ошибка при отправке гемов' + err)
            }
        }

        return { status: true }
    } catch (err) {
        let errMessage;

        if (err instanceof Error) {
            errMessage = err.message
        } else {
            console.error(err);
            errMessage = 'Неизвестная ошибка '
        }

        return { message: errMessage, status: false }
    }
}


// const nameButtomctx3 = interactionButtonEdit(useState[userId].name.value || true);