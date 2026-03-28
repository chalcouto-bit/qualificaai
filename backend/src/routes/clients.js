const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const ctrl = require('../controllers/clientsController');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/upload', auth, upload.single('file'), ctrl.uploadCsv);

module.exports = router;
