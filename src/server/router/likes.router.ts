import { Router } from "express";
import { LikesController } from "../controller/likes.controller";
import { LikeService } from "../services/likes.service";

const router = Router();
const service = new LikeService();
const controller = new LikesController(service)

router.get('/:id', (req, res) => {
    controller.GET(req, res);
});

router.delete('/pending/:penId', (req, res) => {
    controller.PENDINGDELETE(req, res);
})

export const LikesRouter = router;