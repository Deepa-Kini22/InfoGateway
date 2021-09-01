const express = require("express");
const queueController = require("../controllers/queueController");

const router = express.Router();

router.post("/create", queueController.queue_create_post);
router.post('/ack', queueController.queue_ack);
router.post('/log', queueController.queue_log);
router.post('/AddelUser', queueController.queue_AddelUser);
router.post('/reg', queueController.register_App);///register from outside app//super admin shd confrim
router.get("/checkuser/:eventSourceApplication/:key", queueController.check_user);
router.get(
    "/message/:eventSourceApplication/:subscriberId",
    queueController.message_details
);
router.put("/message/:subscriberId", queueController.queue_create_put);
router.post('/inbox', queueController.queue_inbox);
router.get('/verifyOtpEmail/:email/:otp', queueController.verifyOtpEmail);
router.get('/verifyOtpPhone/:pNo/:otp', queueController.verifyOtpPhone);
module.exports = router;
