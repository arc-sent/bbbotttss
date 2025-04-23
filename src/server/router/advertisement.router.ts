import { Router } from "express";
import { AdvertisementService } from "../services/advertisement.service";
import { AdvertisementController } from "../controller/advertisement.controller";

const router = Router();
const service = new AdvertisementService();
const controller = new AdvertisementController(service);

router.get('/', (req, res) => {
    controller.GET(req, res)
});

router.get('/:id', (req, res) => {
    controller.GET(req, res)
});

router.post('/', (req, res) => {
    controller.POST(req, res);
});

router.delete('/:id', (req, res) => {
    controller.DELETE(req, res)
})

export const AdvertisementRouter = router;