const express = require('express');
const conversationController = require('../controllers/conversationController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/', conversationController.getConversations);
router.get('/:id', conversationController.getConversation);
router.get('/:id/messages', conversationController.getMessages);
router.post('/:id/messages', conversationController.sendMessage);
router.patch('/:id/toggle-ai', conversationController.toggleAI);

module.exports = router;
