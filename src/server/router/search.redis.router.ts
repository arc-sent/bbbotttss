import { Router } from "express";
import { SearchReids } from "../controller/search.redis.controller";
import { MatchService } from "../services/match.service";
import { UserService } from "../services/user.service";
import { ReportedService } from "../services/reported.service";
const router = Router();

const serviceMatch = new MatchService();
const userService = new UserService();
const reportedService = new ReportedService();

const controller = new SearchReids(serviceMatch, userService, reportedService);

router.get('/:id', (req, res) => {
    controller.GETMANY(req, res);
});

router.post('/dislike/:myId/:himId', (req, res) => {
    controller.DISLIKE(req, res);
});

router.post('/like/:myId/:himId', (req, res) => {
    controller.LIKE(req, res);
});

router.post('/reported/:myId/:himId', (req, res) => {
    controller.REPORT(req, res);
})


export const RedisRouter = router;