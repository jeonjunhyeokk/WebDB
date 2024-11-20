const express = require('express');
var router = express.Router();
var purchaseview = require('../lib/purchaseview');

// 기본 경로 추가
router.get('/', (req, res) => {
    res.redirect('/purchaseview/view'); // 기본 경로에서 /view로 리디렉트
});

router.get('/view', (req, res) => {
    purchaseview.view(req, res);
});

router.get('/update/:purchase_id', (req, res) => {
    purchaseview.updateForm(req, res);
});

router.post('/update_process', (req, res) => {
    purchaseview.updateProcess(req, res);
});

router.get('/delete/:purchase_id', (req, res) => {
    purchaseview.deleteProcess(req, res);
});

module.exports = router;
