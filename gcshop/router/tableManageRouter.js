const express = require('express');
const router = express.Router();
const tableListController = require('../lib/tableListController'); // 테이블 목록 컨트롤러
const tableDataController = require('../lib/tableDataController'); // 테이블 데이터 컨트롤러

// 35쪽: 테이블 목록 페이지 (기존 tableListView.ejs -> tableManage.ejs)
router.get('/list', (req, res) => {
    tableListController.listTables(req, res);
});

// 36쪽: 특정 테이블 데이터 관리 페이지 (기존 tableDataView.ejs -> tableView.ejs)
router.get('/:tableName', (req, res) => {
    tableDataController.viewTableData(req, res);
});

module.exports = router;
