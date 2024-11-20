const express = require('express');
const router = express.Router();
var root = require('../lib/root');

// 메인 페이지 처리
router.get('/', (req, res) => {
    root.home(req, res);
});

// 카테고리(category) 요청 처리
router.get('/category/:categoryId', (req, res) => {
    root.categoryview(req, res);
});

// 검색(search) 요청 처리
router.post('/search', (req, res) => {
    root.search(req, res);
});

// 상세 페이지(detail) 요청 처리
router.get('/detail/:merId', (req, res) => {
    root.detail(req, res); // 상품 상세 정보 처리
});

module.exports = router;
