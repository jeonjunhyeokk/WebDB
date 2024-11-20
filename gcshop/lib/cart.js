const db = require('./db');
var sanitizeHtml = require('sanitize-html');

function authIsOwner(req, res) {
    var name = 'Guest';
    var login = false;
    var cls = 'NON'; // 기본 cls 값

    if (req.session.is_logined) {
        name = req.session.name;
        login = true;
        cls = req.session.cls;
    }

    return { name, login, cls };
}


module.exports = {
    view: (req, res) => {
        const sqlCart = `
            SELECT 
                c.cart_id AS cart_id, -- cart_id 추가
                c.loginid AS loginid, 
                p.name AS customerName, 
                c.mer_id AS mer_id, 
                prod.name AS productName, 
                c.date AS date
            FROM 
                cart c
            JOIN 
                product prod ON c.mer_id = prod.mer_id
            JOIN 
                person p ON c.loginid = p.loginid
        `;
        const sqlBoardTypes = 'SELECT * FROM boardtype';
        const sqlCodes = 'SELECT * FROM code';

        // 다중 쿼리를 Promise로 처리
        Promise.all([
            new Promise((resolve, reject) => db.query(sqlCart, (err, results) => (err ? reject(err) : resolve(results)))),
            new Promise((resolve, reject) => db.query(sqlBoardTypes, (err, results) => (err ? reject(err) : resolve(results)))),
            new Promise((resolve, reject) => db.query(sqlCodes, (err, results) => (err ? reject(err) : resolve(results)))),
        ])
            .then(([cartItems, boardtypes, codes]) => {
                const { name, login, cls } = authIsOwner(req);

                const context = {
                    who: name,
                    login: login,
                    body: 'cartView', // `cartView.ejs`를 포함
                    cls: cls,
                    cartItems: cartItems, // cart_id도 포함된 데이터
                    boardtypes: boardtypes,
                    codes: codes,
                };

                res.render('mainFrame', context, (err, html) => {
                    if (err) {
                        console.error('Rendering Error:', err);
                        return res.status(500).send('페이지 렌더링 중 오류가 발생했습니다.');
                    }
                    res.end(html);
                });
            })
            .catch((err) => {
                console.error('Database Query Error:', err);
                res.status(500).send('데이터베이스에서 데이터를 가져오는 중 오류가 발생했습니다.');
            });
    },

    updateForm: (req, res) => {
        const cartId = req.params.cart_id;
    
        // 다중 쿼리 작성
        const sql = `
            SELECT 
                c.cart_id AS cartId, 
                c.loginid AS loginId, 
                p.name AS customerName, -- 고객명
                c.mer_id AS merId, 
                prod.name AS productName, -- 상품명
                c.date AS date
            FROM 
                cart c
            JOIN 
                person p ON c.loginid = p.loginid -- loginid로 고객명 가져오기
            JOIN 
                product prod ON c.mer_id = prod.mer_id -- mer_id로 상품명 가져오기
            WHERE 
                c.cart_id = ?;
    
            SELECT loginid, name AS customerName FROM person; -- 고객 데이터 가져오기
    
            SELECT mer_id, name AS productName FROM product; -- 상품 데이터 가져오기
    
            SELECT * FROM boardtype; -- boardtype 데이터 가져오기
    
            SELECT * FROM code; -- code 데이터 가져오기
        `;
    
        // 다중 쿼리 실행
        db.query(sql, [cartId], (err, results) => {
            if (err) {
                console.error('다중 쿼리 실행 오류:', err);
                return res.status(500).send('데이터를 가져오는 중 오류가 발생했습니다.');
            }
    
            const { name, login, cls } = authIsOwner(req, res);
    
            const context = {
                who: name,
                login: login,
                cls: cls,
                body: 'cartU', // 수정 폼을 위한 cartU.ejs
                cart: results[0][0], // 장바구니 항목 데이터 (첫 번째 쿼리 결과)
                customers: results[1], // 고객 데이터 (두 번째 쿼리 결과)
                products: results[2], // 상품 데이터 (세 번째 쿼리 결과)
                boardtypes: results[3], // boardtype 데이터 (네 번째 쿼리 결과)
                codes: results[4], // code 데이터 (다섯 번째 쿼리 결과)
            };
    
            res.render('mainFrame', context, (err, html) => {
                if (err) {
                    console.error('페이지 렌더링 오류:', err);
                    return res.status(500).send('수정 페이지를 로드하는 중 오류가 발생했습니다.');
                }
                res.end(html);
            });
        });
    },        

    updateProcess: (req, res) => {
        const { cart_id, loginid, mer_id, date } = req.body;
    
        // 장바구니 항목 업데이트
        const sql = `
            UPDATE cart
            SET loginid = ?, mer_id = ?, date = ?
            WHERE cart_id = ?
        `;
    
        db.query(sql, [loginid, mer_id, date, cart_id], (err) => {
            if (err) {
                console.error('장바구니 항목 업데이트 오류:', err);
                return res.status(500).send('장바구니 항목 업데이트 중 오류가 발생했습니다.');
            }
    
            // 수정 후 장바구니 관리 페이지로 이동
            res.redirect('/cart/view');
        });
    },

    deleteProcess: (req, res) => {
        const cartId = req.params.cart_id; // GET 요청의 URL 파라미터에서 cart_id 가져오기
    
        // DELETE SQL 쿼리
        const sql = 'DELETE FROM cart WHERE cart_id = ?';
    
        db.query(sql, [cartId], (err) => {
            if (err) {
                console.error(`장바구니 항목 삭제 오류 (cart_id: ${cartId}):`, err);
                return res.status(500).send('장바구니 항목 삭제 중 오류가 발생했습니다.');
            }
            // 삭제 후 장바구니 목록 페이지로 리디렉션
            res.redirect('/cart/view');
        });
    }
};