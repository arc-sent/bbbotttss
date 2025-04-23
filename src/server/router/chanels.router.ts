import { Router } from "express";
import { ChanelsService } from "../services/chanels.service";
import { ChanelsController } from "../controller/chanels.controller";

const router = Router();
const service = new ChanelsService();
const controller = new ChanelsController(service);

router.get('/', (req, res) => {
    controller.GET(req, res)
});

router.post('/', (req, res) => {
    controller.POST(req, res);
});

router.delete('/:body', (req, res) => {
    controller.DELETE(req, res)
})

export const ChanelsRouter = router;