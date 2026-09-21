const express = require('express');
const multer = require('multer');
const contactController = require('../controllers/contactController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(auth);

router.post(
  '/',
  validate({
    name: { required: true, maxLength: 100 },
    phoneNumber: { required: true },
  }),
  contactController.createContact
);

router.get('/export/csv', contactController.exportContacts);
router.get('/', contactController.getContacts);
router.get('/:id', contactController.getContact);

router.put(
  '/:id',
  validate({
    name: { maxLength: 100 },
  }),
  contactController.updateContact
);

router.delete('/:id', contactController.deleteContact);
router.post('/import', upload.single('file'), contactController.importContacts);

module.exports = router;
