const express = require('express');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.post(
  '/register',
  validate({
    name: { required: true, minLength: 2, maxLength: 100 },
    email: { required: true, type: 'email' },
    password: { required: true, minLength: 6 },
  }),
  authController.register
);

router.post(
  '/login',
  validate({
    email: { required: true, type: 'email' },
    password: { required: true },
  }),
  authController.login
);

router.post('/logout', auth, authController.logout);
router.get('/me', auth, authController.getMe);
router.put('/profile', auth, authController.updateProfile);

module.exports = router;
