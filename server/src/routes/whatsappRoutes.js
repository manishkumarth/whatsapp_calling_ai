const express = require('express');
const whatsappController = require('../controllers/whatsappController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(auth);

router.post(
  '/send-message',
  validate({
    to: { required: true },
    text: { required: true },
  }),
  whatsappController.sendMessage
);

router.post(
  '/send-template',
  validate({
    to: { required: true },
    templateName: { required: true },
  }),
  whatsappController.sendTemplate
);

router.get('/status', whatsappController.getStatus);

module.exports = router;
