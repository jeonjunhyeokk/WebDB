//codeRouter.js
const express = require('express');
var router = express.Router();
var codeController = require('../lib/code');

router.get('/view', (req, res) => {
    codeController.view(req, res);
});

router.get('/create', (req, res) => {
    codeController.create(req, res);
});

router.post('/create_process', (req, res) => {
    codeController.create_process(req, res);
});

router.get('/update/:main/:sub/:start/:end', (req, res) => {
    codeController.update(req, res);
});

router.post('/update_process', (req, res) => {
    codeController.update_process(req, res);
});

router.get('/delete/:main/:sub/:start/:end', (req, res) => {
    codeController.delete_process(req, res);
});

module.exports = router;