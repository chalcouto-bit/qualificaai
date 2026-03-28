const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/historyController');

router.get('/:codigoCliente', auth, ctrl.getHistory);

module.exports = router;
