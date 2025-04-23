import { Router } from "express";
import { MatchController } from "../controller/match.controller";
import { MatchService } from "../services/match.service";

const services = new MatchService();
const controller = new MatchController(services);
const router = Router();

router.get('/:id', (req, res) => {
    controller.GET(req, res);
});

router.put('/like/:id', (req, res) => {
    controller.LIKE(req, res);
});

router.put('/dislike/:id', (req, res) => {
    controller.DISLIKE(req, res);
});

router.put('/coin/:fromId/:toId', (req, res) => {
    controller.BROADGEMS(req, res);
})

export const MatchRouter = router;