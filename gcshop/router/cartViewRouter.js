const express = require('express');
const router = express.Router();
const cartController = require('../lib/cart'); // cartController 불러오기

// 장바구니 조회
router.get('/view', (req, res) => {
    cartController.view(req, res);
});

// 장바구니 항목 수정 폼
router.get('/update/:cart_id', (req, res) => {
    cartController.updateForm(req, res);
});

// 장바구니 항목 수정 처리
router.post('/update_process', (req, res) => {
    cartController.updateProcess(req, res);
});

// 장바구니 항목 삭제
router.get('/delete_process/:cart_id', (req, res) => {
    cartController.deleteProcess(req, res);
});

module.exports = router;
