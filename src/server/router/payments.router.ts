import { Router } from "express";
import { PaymentsService } from "../services/payments.service";
import { PaymentsController } from "../controller/payments.controller";

const router = Router();
const service = new PaymentsService();
const controller = new PaymentsController(service);

router.post('/:id', (req, res) => {
    controller.POST(req, res);
});

router.get('/:payId', (req, res) => {
    controller.GET(req, res);
})

router.put('/:payId', (req, res) => {
    controller.PUT(req, res);
})


export const PaymentsRouter = router;