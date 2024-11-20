//productRouter.js
const multer = require('multer');
const express = require('express');
const router = express.Router();
const productController = require('../lib/product');

// Multer
const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) { 
            cb(null, 'public/image'); 
        },
        filename: function (req, file, cb) {
            const newFileName = Buffer.from(file.originalname, "latin1").toString("utf-8");
            cb(null, newFileName);
        }
    }),
});

router.get('/view', (req, res) => {
    productController.view(req, res);
});

router.get('/create', (req, res) => {
    productController.create(req, res);
});

router.post('/create_process', upload.single('uploadFile'), (req, res) => {
    productController.create_process(req, res);
});

router.get('/update/:merId', (req, res) => {
    productController.update(req, res);
});

router.post('/update_process', upload.single('uploadFile'), (req, res) => {
    productController.update_process(req, res);
});

router.get('/delete/:merId', (req, res) => {
    productController.delete_process(req, res);
});

module.exports = router;