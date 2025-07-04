import axios from 'axios';
import { MatchService } from '../services/match.service';
import { ReportedService } from '../services/reported.service';
import { UserService } from '../services/user.service';
import { redis } from './../server';
import { Request, Response } from 'express';

export class SearchReids {
    private redis;
    private serviceMatch;
    private userService;
    private reportedService;

    constructor(serviceMatch: MatchService, userService: UserService, reportedService: ReportedService) {
        this.redis = redis
        this.serviceMatch = serviceMatch
        this.userService = userService
        this.reportedService = reportedService;
    }

    async GETMANY(req: Request, res: Response) {
        try {
            const id = req.params.id;

            if (!id) {
                throw new Error("Ошибка в получении айди")
            }

            const userSearch = await redis.lrange(`user-search-${id}`, 0, -1);

            console.log(userSearch.length)

            if (userSearch.length <= 0) {
                const reqServiceNewSearch = await this.serviceMatch.GET(id);

                console.log('reqServiceNewSearch.status', reqServiceNewSearch.status);
                console.log('reqServiceNewSearch.data.message', reqServiceNewSearch.message);

                if (reqServiceNewSearch.status === 400) {
                    throw new Error(JSON.stringify(reqServiceNewSearch.message));
                }

                if (reqServiceNewSearch.status === 201) {
                    return res.status(201).json({ message: 'Нет подходящих анкет' });
                }

                console.log('reqServiceNewSearch.data.message', reqServiceNewSearch.message)

                await redis.del(`user-search-${id}`);
                console.log('111111111')

                await redis.rpush(`user-search-${id}`, ...reqServiceNewSearch.message);

                return res.status(200).json({ message: reqServiceNewSearch.message });
            }

            return res.status(200).json({ message: userSearch });
        } catch (err) {
            return this._handleError(err)
        }
    }

    async DISLIKE(req: Request, res: Response) {
        const myId = req.params.myId;
        const himId = req.params.himId;

        console.log('myId', myId);

        try {
            const reqService = await this.serviceMatch.DISLIKE(himId);

            if (reqService.status === 400) {
                throw new Error(`Err in dislike: ${reqService.message}`);
            };

            const himData = await this.userService.GET(himId);

            if (himData.status === 400) {
                throw new Error(`Err in get dislike user: ${himData.message}`);
            };

            await this.updateViewed(himId, himData.message.premium, myId)

            await redis.lpop(`user-search-${myId}`);

            res.status(200).json({ message: true });

        } catch (err) {
            this._handleError(err);
        }
    }

    async LIKE(req: Request, res: Response) {
        const myId = req.params.myId;
        const himId = req.params.himId;

        try {
            const likes = await redis.hget(`user-interactions-${myId}`, 'like');
            const likesMax = await redis.hget(`user-interactions-${myId}`, 'likesMax');

            console.log('likes', likes);
            console.log('likesMax', likesMax);

            if (likesMax == null || likes == null) {

                const getUser = await this.userService.GET(myId);

                if (getUser.status === 400) {
                    throw new Error(`Err in get user in like: ${getUser.message}`);
                };

                let likesMaxUs;
                let messageMaxUs;

                if (getUser.premium) {
                    likesMaxUs = 500
                    messageMaxUs = 500
                } else {
                    likesMaxUs = 10
                    messageMaxUs = 5
                }

                await redis.hset(`user-interactions-${myId}`, {
                    likesMax: likesMaxUs,
                    messageMax: messageMaxUs,
                    like: '0',
                    message: '0'
                });
            }

            const likes2 = await redis.hget(`user-interactions-${myId}`, 'like');
            const likesMax2 = await redis.hget(`user-interactions-${myId}`, 'likesMax');

            if (Number(likes2) >= Number(likesMax2)) {
                return res.status(200).json({ message: false });
            } else {
                await redis.hincrby(`user-interactions-${myId}`, 'like', 1);
            }

            const body = {
                fromId: `${myId}`,
                metch: false,
                message: ''
            }

            console.log('body', body)

            const himData = await this.userService.GET(himId);

            const reqService = await this.serviceMatch.LIKE(himId, body);

            console.log('reqService', reqService);

            if (reqService.status === 400) {
                throw new Error(`Err in like: ${reqService.message}`);
            };

            await this.updateViewed(himId, himData.message.premium, myId)

            await redis.lpop(`user-search-${myId}`);

            res.status(200).json({ message: true });
        } catch (err) {
            this._handleError(err);
        }
    }

    async REPORT(req: Request, res: Response) {
        const myId = req.params.myId;
        const himId = req.params.himId;

        try {
            const reqService = await this.reportedService.POST(himId);

            if (reqService.status === 400) {
                throw new Error(`Err in reported: ${reqService.message}`);
            };

            const himData = await this.userService.GET(himId);

            await this.updateViewed(himId, himData.message.premium, myId)

            await redis.lpop(`user-search-${myId}`);

            res.status(200).json({ message: true });
        } catch (err) {
            this._handleError(err);
        }
    }

    private async updateViewed(id: string, premium: boolean, ctxId: string) {
        console.log(id, premium, ctxId)

        const dataAncket = {
            premium: premium,
            count: 1,
            id: id
        }

        const manyAncket = await redis.lrange(`viewed-${ctxId}`, 0, -1);

        const exits = manyAncket.map((item) => {
            const parseItem = JSON.parse(item)
            if (parseItem.id === dataAncket.id) {
                return parseItem
            }
        });

        const dataExits = exits[0];

        if (dataExits) {
            dataExits.count += 1;

            await redis.lrem(`viewed-${ctxId}`, 0, exits[0]);

            await redis.lpush(`viewed-${ctxId}`, JSON.stringify(dataExits));
            await redis.expire(`viewed-${ctxId}`, 43200);
        } else {
            await redis.lpush(`viewed-${ctxId}`, JSON.stringify(dataAncket));
            await redis.expire(`viewed-${ctxId}`, 43200);
        }
    }

    private _handleError(err) {
        if (err instanceof Error) {
            return { message: err.message, status: 400 };
        } else {
            console.error(err);
            return { message: "Unknown error", status: 400 };
        }
    }
}