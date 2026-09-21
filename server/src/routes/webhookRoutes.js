const express = require('express');
const whatsappWebhook = require('../webhooks/whatsappWebhook');

const router = express.Router();

router.get('/whatsapp', whatsappWebhook.verify);
router.post('/whatsapp', express.json({ limit: '1mb' }), whatsappWebhook.handleEvent);

module.exports = router;
