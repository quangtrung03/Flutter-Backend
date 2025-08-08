const express = require('express');
const { momoPayment, handleMomoCallback } = require('../../controllers/common/momoPayment-controller');
const router = express.Router();

router.post('/momo', momoPayment); // Route cho thanh toán MoMo
router.post('/momo/callback', handleMomoCallback); // Route cho callback từ MoMo
router.get('/momo/callback', handleMomoCallback); // Thêm route GET cho callback
module.exports = router;