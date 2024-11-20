const express = require('express');
const router = express.Router();
const analytic = require('../lib/analytic');

// 경영진 분석 화면
router.get('/ceo', (req, res) => {
    analytic.ceoAnalysis(req, res);
});

module.exports = router;
