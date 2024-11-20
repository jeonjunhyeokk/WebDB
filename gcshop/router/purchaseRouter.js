const express = require('express');
const router = express.Router();
const purchase = require('../lib/purchase'); // 구매 관련 로직을 가져옵니다.

// 구매 목록 페이지 처리 (GET 요청)
router.get('/', (req, res) => {
    purchase.list(req, res); // 구매 목록 표시
});

// 상품 구매 처리 (POST 요청)
router.post('/', (req, res) => {
    purchase.purchase(req, res); // 구매 로직 실행
});

// 상품 상세 페이지 처리 (GET 요청)
router.get('/detail/:merId', (req, res) => {
    purchase.detail(req, res); // 상품 상세 정보 처리
});

// 장바구니 보기 (GET 요청)
router.get('/cart', (req, res) => {
    purchase.viewCart(req, res); // 장바구니 페이지 표시
});

// 장바구니 추가 처리 (POST 요청)
router.post('/cart/add', (req, res) => {
    purchase.cart(req, res); // 장바구니 추가 로직 실행
});

// 장바구니 결제 처리 (POST 요청)
router.post('/cart/purchase', (req, res) => {
    purchase.purchaseCart(req, res); // 장바구니 결제 처리
});

// 장바구니 삭제 처리 (POST 요청)
router.post('/cart/delete', (req, res) => {
    purchase.deleteCart(req, res); // 장바구니 삭제 처리
});

// 장바구니에서 선택된 항목 결제 처리 (POST 요청)
router.post('/cart/checkout', (req, res) => {
    purchase.checkout(req, res); // 선택된 장바구니 항목 결제 처리
});

// 구매 취소 처리 (POST 요청)
router.post('/cancel/:purchaseId', (req, res) => {
    purchase.cancel(req, res); // 구매 취소 처리
});

module.exports = router;
