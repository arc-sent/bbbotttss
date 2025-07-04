import cron from 'node-cron';
import { CHANNELS, MyContext } from "./interfaces/state";
import { Scenes, Telegraf, session, Context } from "telegraf";
import dotenv from 'dotenv';
import { profileScene, editScene, editName, editDescription, editPhoto, refreshScene, editAge, editCity, editMinMax, premiumSceneProfile, editStatistics, caseScene, referalScene, shopScene, gemsShop, editGender, editGenderSearch, sendGems, sendGemsCustom, editPhotoInAnket, miniAppScene } from './handlers/profile/get';
import { ancetReport, ancetScene, ancetSceneGems, ancetSceneMessage } from './handlers/search/getAnket';
import { getLikes } from "./handlers/likes/getLikes";
import { getMetch } from "./handlers/metch/get";
import { regScene } from "./commands/reg";
import { ReportScene } from './commands/report';
import Redis from "ioredis";
import axios from "axios";
import { addChanelsScene, adminScene, advertisemenScene, advertisementInSearch, banScene, chanelsScene, createAdvertisementScenes, deleteAdvertisementScenes, deleteChanelsScene, getAdvertisementScenes, premiumSceneAdmin, sessionUser, unbanScene } from "./commands/admin";
import { checkoutQuery } from "./payments/checkoutQuery";
import { successfulPayment } from "./payments/successfulPayment";
import { caseBronzaScene, caseEveryDayScene, caseGoldScene, caseMysteryScene, casePlatinumScene, caseShopScene, caseSilverScene } from './handlers/commands/case';
import { topScenes } from './commands/top';
import { Markup } from 'telegraf';
import { inlineKeyboard } from 'telegraf/typings/markup';
import { editMessage as editMessageFromGetAnket } from './handlers/search/getAnket';

dotenv.config();

const token = process.env.TELEG_TOKEN || '';

export const redis = new Redis(process.env.URL_REDIS || '');

if (token === '') {
  console.error('Ошбика при получении токена')
}

interface MyContextBot extends Context {
  session: Record<string, any>;
}


export const bot = new Telegraf<MyContextBot>(token);
export const stage = new Scenes.Stage<MyContext>([]);

const locationScene = new Scenes.WizardScene<MyContext>('locationScene', async (ctx) => {
  await ctx.reply(
    '📍 Отправь, пожалуйста, свою геолокацию:\n\nСкрепка → Локация → Отправить'
  );

  return ctx.wizard.next();
}, async (ctx) => {
  try {
    if (!ctx.message) {
      throw new Error('Ошибка в получении сообщения')
    }

    if ('location' in ctx.message) {
      console.log('ctx.message.location', ctx.message.location);

      const { latitude, longitude } = ctx.message.location;
      await ctx.reply(`Спасибо! Получена локация:\nШирота: ${latitude}\nДолгота: ${longitude}`);

      const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;

      const req = await axios.get(url, {
        validateStatus: () => true
      });

      if (req.status === 400) {
        throw new Error(JSON.stringify(req.data));
      }

      console.log(req.data);
      const city = req.data.address.city || req.data.address.town || req.data.address.village || req.data.address.municipality || req.data.address.hamlet

      await ctx.reply(`Твой город: ${city}`);

      return ctx.scene.leave();
    }
  } catch (err) {
    if (err instanceof Error) {
      console.error(err.message);
    } else {
      console.error(err);
    }
    await ctx.reply('Произошла ошибка! Чекни консоль.');
  }


})


bot.use(session());
bot.use(stage.middleware() as any);

stage.register(profileScene);
stage.register(editScene);
stage.register(editName);
stage.register(editDescription);
stage.register(editPhoto);
stage.register(refreshScene);
stage.register(ancetScene);
stage.register(getLikes);
stage.register(ancetSceneMessage);
stage.register(getMetch);
stage.register(regScene);
stage.register(editAge);
stage.register(editCity);
stage.register(editMinMax);
stage.register(ReportScene);
stage.register(adminScene);
stage.register(banScene);
stage.register(unbanScene);
stage.register(premiumSceneProfile);
stage.register(premiumSceneAdmin);
stage.register(editStatistics);
stage.register(ancetReport);
stage.register(caseScene);
stage.register(caseBronzaScene);
stage.register(caseSilverScene);
stage.register(caseGoldScene);
stage.register(casePlatinumScene);
stage.register(caseMysteryScene);
stage.register(caseShopScene);
stage.register(sessionUser);
stage.register(caseEveryDayScene);
stage.register(advertisemenScene);
stage.register(chanelsScene);
stage.register(addChanelsScene);
stage.register(deleteChanelsScene);
stage.register(advertisementInSearch);
stage.register(createAdvertisementScenes);
stage.register(referalScene)
stage.register(deleteAdvertisementScenes);
stage.register(getAdvertisementScenes);
stage.register(shopScene);
stage.register(gemsShop);
stage.register(topScenes);
stage.register(editGender);
stage.register(editGenderSearch);
stage.register(locationScene);
stage.register(ancetSceneGems);
stage.register(sendGems);
stage.register(sendGemsCustom);
stage.register(editPhotoInAnket);
stage.register(miniAppScene);

const updateMessage = async (ctx: any) => {
  if (ctx.session.sendMessage) {
    const result = await editMessageFromGetAnket(ctx);

    if (!result) {
      console.log('Ошибка в исправлении сообщения!');
    }
  }
}

let REQUIRED_CHANNELS_LET: string[] = [];

const url = process.env.URL;


cron.schedule('*/10 * * * *', async () => {
  try {
    const req = await axios.get(`${url}/chanels`);
    if (req.status === 400) throw new Error(req.data.message);

    REQUIRED_CHANNELS_LET = req.data.message.map((item: CHANNELS) => item.nickname);
    console.log("🔄 Обновлён список каналов:", REQUIRED_CHANNELS_LET);
  } catch (err) {
    console.error('❌ Ошибка при обновлении списка каналов:', err);
  }
});

cron.schedule('0 0 * * *', () => {
  bot.context.session = {};
});


export const checkSubscriptionMiddleware = async (ctx: any) => {
  try {
    const userId = ctx.from.id;
    let notSubscribedChannels: string[] = [];

    for (const channel of REQUIRED_CHANNELS_LET) {
      try {
        const chatMember = await ctx.telegram.getChatMember(channel, userId);
        if (!['member', 'administrator', 'creator'].includes(chatMember.status)) {
          notSubscribedChannels.push(channel);
        }
      } catch (error) {
        console.error(`⚠️ Ошибка проверки подписки на канал ${channel}:`, error);
      }
    }

    if (notSubscribedChannels.length > 0) {
      const channelLinks = notSubscribedChannels
        .map(channel => `👉 <a href="https://t.me/${channel.replace('@', '')}">${channel}</a>`)
        .join('\n');

      await ctx.reply(
        `❌ <b>Чтобы пользоваться ботом, подпишитесь на каналы:</b>\n\n${channelLinks}`,
        { parse_mode: 'HTML' }
      );
      return;
    }

    return true;
  } catch (error) {
    console.error('❌ Ошибка проверки подписки:', error);
    return false
  }
};

bot.use(async (ctx, next) => {
  const check = await checkSubscriptionMiddleware(ctx);

  console.log(check);
  if (check) {
    return next()
  } else {
    console.error('Ошибка при проверке подписки');
  }
});

bot.command('editname', (ctx: any) => {
  ctx.scene.enter('testScene');
});

bot.on('photo', (ctx) => {
  const photo = ctx.message?.photo;

  console.log(photo[0].file_id);
  const fileId = photo[0].file_id;

  ctx.reply(JSON.stringify(fileId));
})

bot.command('start', async (ctx) => {
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

});

bot.command('nexySession', async (ctx: any) => {
  try {
    const url = process.env.URL;

    const getUser = await axios.get(`${url}/users/${ctx.from?.id}`);

    const user = getUser.data.message;

    if (user.role !== 'admin') {
      await ctx.reply('⛔ У вас недостаточно прав для выполнения этого действия.');
      return
    }

    ctx.reply(JSON.stringify(ctx.session));
  } catch (err) {
    if (err instanceof Error) {
      console.error(err.message);
    } else {
      console.error(err);
    }

    await ctx.reply('Произошла ошибка при проверке статуса юзера! Перезапустите команду и попробуйте езе раз');
  }
});

bot.command('clearNexySession', async (ctx: any) => {
  try {
    const url = process.env.URL;

    const getUser = await axios.get(`${url}/users/${ctx.from?.id}`);

    const user = getUser.data.message;

    if (user.role !== 'admin') {
      await ctx.reply('⛔ У вас недостаточно прав для выполнения этого действия.');
      return
    }

    bot.context.session = {};
    await ctx.reply('Успешное очищение сессии!');
    console.log(ctx.session);
  } catch (err) {
    if (err instanceof Error) {
      console.error(err.message);
    } else {
      console.error(err);
    }

    await ctx.reply('Произошла ошибка при проверке статуса юзера! Перезапустите команду и попробуйте езе раз');
  }
});

bot.command('testUsersGet', async (ctx) => {
  try {
    const url = process.env.URL;

    const getUser = await axios.get(`${url}/users`);

    const user = getUser.data.message;

    console.log(user);

    await ctx.reply(JSON.stringify(user[0]));
  } catch (err) {
    if (err instanceof Error) {
      console.error(err.message);
    } else {
      console.error(err);
    }

    await ctx.reply('Произошла ошибка при проверке получении юзеров!');
  }
});

bot.command('send', async (ctx: any) => {
  ctx.scene.enter('sendGems');
})

bot.command('reported', async (ctx: any) => {
  ctx.scene.enter('reportScene');
});

bot.command('register', async (ctx: any) => {
  ctx.scene.enter('regScene');
});

bot.command('luchaevaMuda', async (ctx: any) => {
  ctx.scene.enter('adminScene');
})

bot.command('testPayments', async (ctx: any) => {
  await redis.set(`pay-${ctx.from.id}`, JSON.stringify({ payload: 24, count: 1000000, type: 'GEMS' }));

  await successfulPayment(ctx);
});

bot.command('top', async (ctx: any) => {
  await updateMessage(ctx)
  ctx.session.countTop = 1;
  ctx.session.sendMessage = 0;
  ctx.scene.enter('topScenes');
})

bot.hears('👤 Профиль', async (ctx: any) => {
  await updateMessage(ctx)

  ctx.scene.enter('profileScene');
});

bot.hears('👤', async (ctx: any) => {
  await updateMessage(ctx)
  ctx.scene.enter('profileScene');
});

bot.hears('🔍 Поиск', async (ctx: any) => {
  await updateMessage(ctx)
  ctx.session.keyboard = true
  ctx.session.sendMessage = 0
  ctx.scene.enter('ancetScene');
});

bot.hears('❤️ Лайки', async (ctx: any) => {
  await updateMessage(ctx)
  ctx.scene.enter('getLikes');
});

bot.hears('💌 Метчи', async (ctx: any) => {
  await updateMessage(ctx)
  ctx.session.sendMessage = 0;
  ctx.session.count = 0;
  ctx.scene.enter('getMetch');
});

bot.hears('🥇 Топ', async (ctx: any) => {
  await updateMessage(ctx)
  ctx.session.sendMessage = 0
  ctx.session.countTop = 1
  ctx.scene.enter('topScenes');
});

bot.hears('📦 Кейсы', async (ctx: any) => {
  await updateMessage(ctx)
  ctx.scene.enter('caseScene');
});


bot.hears('🛒 Магазин', async (ctx: any) => {
  await updateMessage(ctx)
  ctx.session.exitGems = false;
  return ctx.scene.enter("shopScene");
});


bot.hears('🔗 Рефералка', async (ctx: any) => {
  await updateMessage(ctx)
  ctx.scene.enter("referalScene");
});

bot.hears('💠 Гемы', async (ctx: any) => {
  await updateMessage(ctx)
  ctx.session.exitGems = false
  ctx.session.sendMessage = 0
  return ctx.scene.enter('sendGems');
});

bot.command('profile', async (ctx: any) => {
  await updateMessage(ctx)
  ctx.scene.enter('profileScene');
});

bot.command('help', async (ctx: any) => {
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
});

bot.command('search', async (ctx: any) => {
  await updateMessage(ctx)
  ctx.scene.enter('ancetScene');
});

bot.command('likes', async (ctx: any) => {
  await updateMessage(ctx)
  ctx.scene.enter('getLikes');
});

bot.command('metches', async (ctx: any) => {
  await updateMessage(ctx)
  ctx.scene.enter('getMetch');
});

bot.hears('Включить анкету', async (ctx: any) => {
  try {
    const url = process.env.URL;
    const req = await axios.put(`${url}/users/${ctx.from?.id}/shutdown`, {
      status: false
    }, {
      validateStatus: () => true
    });

    if (req.status === 400) {
      throw new Error(JSON.stringify(req.data.message));
    }

    return ctx.scene.enter('profileScene');
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Ошибка при отключении анкеты: ${err.message}`)
    } else {
      console.error(`Ошибка при отключении анкеты. Ошибка неизвестная: ${err}`)
    }

    await ctx.reply('Ошибка при включении анкеты! Попробуйте позже.')
  }
});

bot.on('pre_checkout_query', async (ctx: any) => {
  await checkoutQuery(ctx)
});

bot.on('successful_payment', async (ctx) => {
  await successfulPayment(ctx);
});

bot.command('testlocation', async (ctx: any) => {
  return ctx.scene.enter('locationScene')
});

if (process.env.NODE_ENV === 'production') {
  const urlNgrok = process.env.URLN
  const webhookPath = `${urlNgrok}/webhook`;

  console.log('worrrk')

  bot.telegram.setWebhook(webhookPath).then(() => {
    console.log("Webhook set to:", webhookPath);
  }).then(() => {
    console.log('Bot started!')
  })
    .catch((err) => {
      console.log('Bot start with error!', err);
    });
} else {
  bot.launch()
    .then(() => {
      console.log('Bot started!')
    })
    .catch((err) => {
      console.log('Bot start with error!', err);
    })

}

// bot.launch()
//   .then(() => {
//     console.log('Bot started!')
//   })
//   .catch((err) => {
//     console.log('Bot start with error!', err);
//   })

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
export default bot;