const express = require('express');
const router = express.Router();
const personController = require('../lib/person'); 

router.get('/view', (req, res) => {
    personController.view(req, res);
});

router.get('/create', (req, res) => {
    personController.create(req, res);
});

router.post('/create_process', (req, res) => {
    personController.create_process(req, res);
});

router.get('/update/:loginId', (req, res) => {
    personController.update(req, res);
});

router.post('/update_process', (req, res) => {
    personController.update_process(req, res);
});

router.get('/delete/:loginId', (req, res) => {
    personController.delete_process(req, res);
});

module.exports = router;
