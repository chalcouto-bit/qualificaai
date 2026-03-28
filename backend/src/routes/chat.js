const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/chatController');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/', auth, ctrl.chat);
router.post('/audio', auth, upload.single('audio'), ctrl.audioToText);

module.exports = router;
