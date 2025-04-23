import express from 'express';
import dotenv from 'dotenv';
import { UserRouter } from './router/user.router';
import { MatchRouter } from './router/match.router';
import { LikesRouter } from './router/likes.router';
import { MatchRealRouter } from './router/match.real.router';
import { ReportedRouter } from './router/reported.router';
import Redis from 'ioredis';
import { PaymentsRouter } from './router/payments.router';
import { addCaseEveryDayField, checkPremium, deleteSearchRedis, deleteUserInteractions, searchViewed, updateTop } from './services/check.service';
import cron from 'node-cron';
import { ChanelsRouter } from './router/chanels.router';
import { AdvertisementRouter } from './router/advertisement.router';
import { deleteChanelsInSearch } from './services/check.service';
import { PrismaClient } from '@prisma/client';
import bot from '../bot';

dotenv.config();

const port = process.env.PORT || 1000;
export const redis = new Redis(process.env.URL_REDIS || '');
const prisma = new PrismaClient();

const main = async () => {
  const app = express();

  app.use(express.json());

  app.get('/', (req, res) => {
    res.status(200).json({ message: 'sucsesful get request' })
  });


  app.use(bot.webhookCallback('/webhook'))

  app.use('/users', UserRouter);

  app.use('/match', MatchRouter);
  app.use('/likes', LikesRouter);
  app.use('/matchReal', MatchRealRouter);
  app.use('/report', ReportedRouter);
  app.use('/payments', PaymentsRouter);
  app.use('/chanels', ChanelsRouter);
  app.use('/advertisement', AdvertisementRouter);

  // app.get('/top', async (req, res) => {
  //   try {
  //     const topUsers = await prisma.userBot.findMany({
  //       where: {
  //         top: {
  //           gte: 1,
  //           lte: 20,
  //         },
  //       },
  //       orderBy: {
  //         top: 'asc',
  //       },
  //       take: 20,
  //       select: {
  //         id: true,
  //       },
  //     });

  //     if (!topUsers) {
  //       throw new Error('Ошибка в получении топа юзера!');
  //     }

  //     const topUserEdit = topUsers.map(item => {
  //       return item.id
  //     })

  //     res.status(200).json({ message: topUserEdit })
  //   } catch (err) {
  //     if (err instanceof Error) {
  //       res.status(400).json({ message: err.message });
  //     }

  //     res.status(400).json({ message: 'Неизвестная ошибка!' })
  //   }
  // })

  // app.post('/test', async (req, res) => {
  //   const resultDeleteChanelsInSearch = await updateTop();
  //   res.status(200).json({ message: resultDeleteChanelsInSearch.message })
  // })


  cron.schedule('0 0 * * *', async () => {
    console.log('Проверка запущенна');

    const resultPremium = await checkPremium();
    console.log(resultPremium.message);

    const resultCaseEveryDayField = await addCaseEveryDayField();
    console.log(resultCaseEveryDayField.message);

    const resultUpdateTop = await updateTop();
    console.log(resultUpdateTop.message);

    const resultDeleteChanelsInSearch = await deleteChanelsInSearch();
    console.log(resultDeleteChanelsInSearch.message);
  });

  cron.schedule('0 */6 * * *', async () => {
    console.log('Начинается очистка ленты поиска:')
    const resultDeleteChanelsInSearch = await searchViewed();
    console.log(resultDeleteChanelsInSearch.message);
  });

  cron.schedule('0 9,21 * * *', deleteUserInteractions, {
    timezone: 'Europe/Moscow',
  });

  app.listen(port, () => {
    console.log(`Server start in ${port}`);
  })


}

main()