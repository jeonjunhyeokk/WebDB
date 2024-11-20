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
    home: (req, res) => {
        var sql1 = 'SELECT * FROM boardtype;';
        var sql2 = `SELECT * FROM product;`;
        var sql3 = 'SELECT * FROM code;';
        db.query(sql1 + sql2 + sql3, (error, results) => {
            if (error) { throw error; }
            var { name, login, cls } = authIsOwner(req, res);
            var body = '';
            var boardtypes = results[0];
            var products = results[1];
            var codes = results[2];
            if (products.length === 0) {
                body = 'test.ejs';
            } else {
                body = 'product.ejs';
            }

            var context = {
                who: name,
                login: login,
                body: body,
                cls: cls,
                boardtypes: boardtypes,
                products: products,
                codes: codes,
                path: 'root'
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

    categoryview: (req, res) => {
        const mainId = sanitizeHtml(req.params.categoryId); // categoryId를 mainId로 사용

        const sql1 = 'SELECT * FROM boardtype;';
        const sql2 = `
            SELECT * FROM product 
            WHERE main_id = ?;
        `;
        const sql3 = 'SELECT * FROM code;';

        // 첫 번째 쿼리 실행
        db.query(sql1, (err, boardtypes) => {
            if (err) {
                console.error(err);
                return res.status(500).send('boardtype 데이터를 가져오는 중 오류가 발생했습니다.');
            }

            // 두 번째 쿼리 실행
            db.query(sql2, [mainId], (err, products) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('product 데이터를 가져오는 중 오류가 발생했습니다.');
                }

                // 세 번째 쿼리 실행
                db.query(sql3, (err, codes) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).send('code 데이터를 가져오는 중 오류가 발생했습니다.');
                    }

                    const { name, login, cls } = authIsOwner(req, res);

                    const context = {
                        who: name,
                        login: login,
                        cls: cls,
                        boardtypes: boardtypes,
                        products: products, // main_id로 필터링된 상품 데이터
                        codes: codes,
                        body: 'product.ejs'
                    };

                    res.render('mainFrame', context, (err, html) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).send('페이지 렌더링 중 오류가 발생했습니다.');
                        }
                        res.end(html);
                    });
                });
            });
        });
    },


    search: (req, res) => {
        const searchKeyword = sanitizeHtml(req.body.Search || ''); // 검색어가 없을 경우 빈 문자열로 처리
        if (!searchKeyword) {
            return res.status(400).send('검색어를 입력해주세요.');
        }

        const sql1 = 'SELECT * FROM boardtype;';
        const sql2 = `
            SELECT * FROM product 
            WHERE name LIKE ? OR brand LIKE ? OR supplier LIKE ?;
        `;
        const sql3 = 'SELECT * FROM code;';

        const likeKeyword = `%${searchKeyword}%`;

        // 첫 번째 쿼리 실행
        db.query(sql1, (err, boardtypes) => {
            if (err) {
                console.error(err);
                return res.status(500).send('boardtype 데이터를 가져오는 중 오류가 발생했습니다.');
            }

            // 두 번째 쿼리 실행
            db.query(sql2, [likeKeyword, likeKeyword, likeKeyword], (err, products) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('검색 중 오류가 발생했습니다.');
                }

                // 세 번째 쿼리 실행
                db.query(sql3, (err, codes) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).send('code 데이터를 가져오는 중 오류가 발생했습니다.');
                    }

                    const { name, login, cls } = authIsOwner(req, res);

                    const context = {
                        who: name,
                        login: login,
                        cls: cls,
                        boardtypes: boardtypes,
                        products: products,
                        codes: codes,
                        body: 'product.ejs'
                    };

                    res.render('mainFrame', context, (err, html) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).send('페이지 렌더링 중 오류가 발생했습니다.');
                        }
                        res.end(html);
                    });
                });
            });
        });
    },

    detail: (req, res) => {
        const merId = sanitizeHtml(req.params.merId); // mer_id 가져오기

        const sql1 = 'SELECT * FROM boardtype;';
        const sql2 = 'SELECT * FROM code;';
        const sql3 = `
            SELECT * FROM product WHERE mer_id = ?;
        `;

        // 첫 번째 쿼리 실행
        db.query(sql1, (err, boardtypes) => {
            if (err) {
                console.error(err);
                return res.status(500).send('boardtype 데이터를 가져오는 중 오류가 발생했습니다.');
            }

            // 두 번째 쿼리 실행
            db.query(sql2, (err, codes) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('code 데이터를 가져오는 중 오류가 발생했습니다.');
                }

                // 세 번째 쿼리 실행
                db.query(sql3, [merId], (err, products) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).send('상품 데이터를 가져오는 중 오류가 발생했습니다.');
                    }

                    if (products.length === 0) {
                        return res.status(404).send('해당 상품을 찾을 수 없습니다.');
                    }

                    // 상품 데이터가 존재하면 첫 번째 상품을 사용
                    const product = products[0];  // 배열에서 첫 번째 제품을 사용

                    const { name, login, cls } = authIsOwner(req, res);

                    const context = {
                        who: name,
                        login: login,
                        body: 'productDetail.ejs', // productDetail 템플릿으로 렌더링
                        cls: cls,
                        boardtypes: boardtypes, // 추가된 boardtype 데이터
                        codes: codes,           // 추가된 codes 데이터
                        product: product,       // 상품 상세 데이터
                    };

                    res.render('mainFrame', context, (err, html) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).send('페이지 렌더링 중 오류가 발생했습니다.');
                        }
                        res.end(html);
                    });
                });
            });
        });
    }
};
