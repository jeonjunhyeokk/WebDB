const express = require('express');
const router = express.Router();
const anal = require('../lib/anal'); // 분석 메소드 파일 가져오기

router.get('/customer', (req, res) => {
    anal.customeranal(req, res);
});

module.exports = router;
