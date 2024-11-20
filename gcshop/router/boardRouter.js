const express = require('express');
const router = express.Router();
const boardController = require('../lib/board');

//boardtype시작
router.get('/type/view', (req, res) => {
    boardController.typeview(req, res); // board.typeview
});

router.get('/type/create', (req, res) => {
    boardController.typecreate(req, res); // board.typecreate
});

router.post('/type/create_process', (req, res) => {
    boardController.typecreate_process(req, res); // board.typecreate_process
});

router.get('/type/update/:typeId', (req, res) => {
    boardController.typeupdate(req, res); // board.typeupdate
});

router.post('/type/update_process', (req, res) => {
    boardController.typeupdate_process(req, res); // board.typeupdate_process
});

router.get('/type/delete/:typeId', (req, res) => {
    boardController.typedelete_process(req, res); // board.typedelete_process
});

//board시작
router.get('/view/:typeId/:pNum', (req, res) => {
    boardController.view(req, res); // board.view
});

router.get('/create/:typeId', (req, res) => {
    boardController.create(req, res); // board.create
});

router.post('/create_process', (req, res) => {
    boardController.create_process(req, res); // board.create_process
});

router.get('/detail/:boardId/:pNum', (req, res) => {
    boardController.detail(req, res); // board.detail
});

router.get('/update/:boardId/:typeId/:pNum', (req, res) => {
    boardController.update(req, res); // board.update
});

router.post('/update_process', (req, res) => {
    boardController.update_process(req, res); // board.update_process
});

router.get('/delete/:boardId/:typeId/:pNum', (req, res) => {
    boardController.delete_process(req, res); // board.delete_process
});

module.exports = router;
