import { Router } from "express";
import { UserService } from "../services/user.service";
import { UserController } from "../controller/user.controller";

const router = Router();

const service = new UserService();
const controller = new UserController(service);

router.get('/:id', (req, res) => {
    controller.GET(req, res);
});

router.put('/:id', (req, res) => {
    controller.PUT(req, res);
})

router.delete('/:id', (req, res) => {
    controller.DELETE(req, res);
})

router.post('/', (req, res) => {
    controller.POST(req, res);
})

router.patch('/:id', (req, res) => {
    controller.PATH(req, res);
})

router.put('/:id/premium', (req, res) => {
    controller.PREMIUM(req, res)
})

router.patch('/:id/statistics', (req, res) => {
    controller.STATISTICS(req, res);
})

router.put('/:id/gems', (req, res) => {
    controller.GEMS(req, res);
})

router.put('/:id/case', (req, res) => {
    controller.CASE(req, res);
});

router.put('/referal/:invitedId/:invitingId', (req, res) => {
    controller.REFERRAL(req, res);
});

router.put('/:id/shutdown', (req, res) => {
    controller.SHUTDOWN(req, res);
});

router.put('/:id/viewed', (req, res) => {
    controller.VIEWED(req, res);
})

router.get('/top/:topNum', (req, res) => {
    controller.TOP(req, res)
});

router.put('/:id/gender', (req, res) => {
    controller.GENDER(req, res);
});

router.put('/:id/gender/search', (req, res) => {
    controller.EDITGENDER(req, res);
})

router.get('/', (req, res) => {
    controller.MANYGET(req, res);
})

router.get('/:id/photo', (req, res) => {
    controller.GETPHOTO(req, res);
})
export const UserRouter = router;