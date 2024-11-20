const db = require('./db');
const sanitizeHtml = require('sanitize-html');

function authIsOwner(req, res) {
    var name = 'Guest';
    var login = false;
    var cls = 'NON';
    if (req.session.is_logined) {
        name = req.session.name;
        login = true;
        cls = req.session.cls;
    }
    return { name, login, cls };
}

module.exports = {
    // 제품 목록 보기
    view: (req, res) => {
        const sql1 = 'SELECT * FROM product';
        const sql2 = 'SELECT * FROM boardtype';
        const sql3 = 'SELECT * FROM code';

        // 데이터베이스 쿼리 실행
        db.query(sql1 + ';' + sql2 + ';' + sql3, (error, results) => {
            if (error) {
                console.error(error);
                return res.status(500).send('데이터를 가져오는 중 오류가 발생했습니다.');
            }

            // 세션 정보 가져오기
            const { name, login, cls } = authIsOwner(req, res);

            // 결과를 각 변수에 저장
            const products = results[0] || [];
            const boardtypes = results[1] || [];
            const codes = results[2] || [];

            // 컨텍스트 객체 생성
            const context = {
                who: name,
                login: login,
                body: 'product.ejs',
                cls: cls,
                boardtypes: boardtypes,
                products: products,
                codes: codes,
                path: 'product'
            };

            // 템플릿 렌더링
            res.render('mainFrame', context, (err, html) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('페이지 렌더링 중 오류가 발생했습니다.');
                }
                res.end(html);
            });
        });
    },

    // 제품 추가 페이지
    create: (req, res) => {
        const sql1 = 'SELECT * FROM code';
        const sql2 = 'SELECT * FROM boardtype';

        db.query(sql1 + ';' + sql2, (error, results) => {
            if (error) {
                console.error(error);
                return res.status(500).send('데이터를 가져오는 중 오류가 발생했습니다.');
            }

            const { name, login, cls } = authIsOwner(req, res);
            const codes = results[0] || [];
            const boardtypes = results[1] || [];
            const categorys = results[0] || []; // categorys 변수 추가

            const context = {
                who: name,
                login: login,
                body: 'productC.ejs',
                cls: cls,
                boardtypes: boardtypes,
                codes: codes,
                categorys: categorys, // categorys 전달
                mode: 'create',
                mer: null
            };

            res.render('mainFrame', context, (err, html) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('페이지 렌더링 중 오류가 발생했습니다.');
                }
                res.end(html);
            });
        });
    },

    // 제품 추가 처리
    create_process: (req, res) => {
        const post = req.body;

        const sanitizedCategory = sanitizeHtml(post.category);
        const sanitizedMainId = sanitizedCategory.substr(0, 4);
        const sanitizedSubId = sanitizedCategory.substr(4, 4);
        const sanitizedName = sanitizeHtml(post.name);
        const sanitizedPrice = sanitizeHtml(post.price);
        const sanitizedStock = sanitizeHtml(post.stock);
        const sanitizedBrand = sanitizeHtml(post.brand);
        const sanitizedSupplier = sanitizeHtml(post.supplier);
        const sanitizedSaleYn = sanitizeHtml(post.sale_yn);
        const sanitizedSaleprice = sanitizeHtml(post.sale_price);

        const sanitizedimageFilePath = sanitizeHtml(req.file ? `/image/${req.file.filename}` : null);

        const sqlInsert = `
            INSERT INTO product (main_id, sub_id, name, price, stock, brand, supplier, image, sale_yn, sale_price) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            sanitizedMainId, sanitizedSubId, sanitizedName, sanitizedPrice,
            sanitizedStock, sanitizedBrand, sanitizedSupplier, sanitizedimageFilePath,
            sanitizedSaleYn, sanitizedSaleprice
        ];

        db.query(sqlInsert, params, (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send('제품 추가 중 오류가 발생했습니다.');
            }
            res.redirect('/product/view');
        });
    },

    // 제품 수정 페이지
    update: (req, res) => {
        const sntzedMerId = sanitizeHtml(req.params.merId);

        const sql1 = 'SELECT * FROM boardtype';
        const sql2 = 'SELECT main_id, sub_id, main_name, sub_name FROM code';
        const sql3 = 'SELECT * FROM product WHERE mer_id = ?';

        db.query(sql1 + ';' + sql2 + ';' + sql3, [sntzedMerId], (error, results) => {
            if (error) {
                console.error(error);
                return res.status(500).send('데이터를 가져오는 중 오류가 발생했습니다.');
            }

            const { name, login, cls } = authIsOwner(req, res);
            const boardtypes = results[0] || [];
            const codes = results[1] || [];
            const categorys = results[1] || []; // categorys 추가
            const product = results[2][0];

            const context = {
                who: name,
                login: login,
                body: 'productU.ejs',
                cls: cls,
                boardtypes: boardtypes,
                codes: codes,
                categorys: categorys, // categorys 전달
                product: product,
                mode: 'update'
            };

            res.render('mainFrame', context, (err, html) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('페이지 렌더링 중 오류가 발생했습니다.');
                }
                res.end(html);
            });
        });
    },

    // 제품 수정 처리
    update_process: (req, res) => {
        const product = req.body;
        const sntzedCategory = sanitizeHtml(product.category);
        const main_id = sntzedCategory.substr(0, 4);
        const sub_id = sntzedCategory.substr(4, 4);
        const mer_id = sanitizeHtml(product.mer_id);
        const sntzedName = sanitizeHtml(product.name);
        const sntzedPrice = parseInt(sanitizeHtml(product.price));
        const sntzedStock = parseInt(sanitizeHtml(product.stock));
        const sntzedBrand = sanitizeHtml(product.brand);
        const sntzedSupplier = sanitizeHtml(product.supplier);
        const sntzedFile = product.image;
        const sntzedSaleYn = sanitizeHtml(product.sale_yn);
        const sntzedSalePrice = parseInt(sanitizeHtml(product.sale_price)) || 0;

        db.query(`UPDATE product SET main_id=?, sub_id=?, name=?, price=?, stock=?, brand=?, supplier=?, image=?, sale_yn=?, sale_price=? 
                  WHERE mer_id=?`,
            [main_id, sub_id, sntzedName, sntzedPrice, sntzedStock, sntzedBrand, sntzedSupplier, sntzedFile, sntzedSaleYn, sntzedSalePrice, mer_id],
            (error, result) => {
                if (error) {
                    console.error(error);
                    return res.status(500).send('제품 업데이트 중 오류가 발생했습니다.');
                }
                res.redirect('/product/view');
            });
    },

    // 제품 삭제 처리
    delete_process: (req, res) => {
        const sntzedMerId = sanitizeHtml(req.params.merId);

        db.query('DELETE FROM product WHERE mer_id=?', [sntzedMerId], (error, result) => {
            if (error) {
                console.error(error);
                return res.status(500).send('제품 삭제 중 오류가 발생했습니다.');
            }
            res.redirect('/product/view');
        });
    }
};
