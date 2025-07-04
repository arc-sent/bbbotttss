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
import cors from 'cors';
import { RedisRouter } from './router/search.redis.router';

dotenv.config();

const port = process.env.PORT || 1000;
export const redis = new Redis(process.env.URL_REDIS || '');
const prisma = new PrismaClient();

const main = async () => {
  const app = express();

  app.use(express.json());
  // app.use(cors({
  //   origin: 'http://localhost:5173',
  //   credentials: true,
  // }));

  app.use(cors());

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
  app.use('/redisSearch' , RedisRouter);


  app.post('/test', async (req, res) => {
    const resultDeleteChanelsInSearch = await updateTop();
    res.status(200).json({ message: resultDeleteChanelsInSearch.message })
  })


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