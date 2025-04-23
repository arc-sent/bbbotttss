import { Router } from "express";
import { MatchReal } from "../controller/match.real.controller";
import { MatchServiceReal } from "../services/match.real.service";

const router = Router();
const service = new MatchServiceReal();
const controller = new MatchReal(service)

router.get('/:id', (req, res) => {
    controller.GET(req, res)
});

export const MatchRealRouter = router;