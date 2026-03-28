const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/settingsController');

router.get('/', auth, ctrl.getApiKey);
router.post('/', auth, ctrl.saveApiKey);

module.exports = router;
