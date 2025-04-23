import { Router } from "express";
import { ReportedService } from "../services/reported.service";
import { ReportedController } from "../controller/reported.controller";

const router = Router();

const service = new ReportedService();
const controller = new ReportedController(service);

router.post('/:id', (req, res) => {
    controller.POST(req, res);
});

router.post('/:id/banned', (req, res) => {
    controller.BANNED(req, res)
});

router.post('/:id/unbanned', (req, res) => {
    controller.UNBANNED(req, res)
});

router.post('/:id/leave', (req, res) => {
    controller.LEAVE(req, res)
});

router.get('/', (req, res) => {
    controller.GETREPORTED(req, res);
})

router.post('/', (req, res) => {
    controller.ANNOUNCEMENT(req, res);
})

export const ReportedRouter = router;