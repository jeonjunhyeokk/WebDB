const db = require('./db');
const sanitizeHtml = require('sanitize-html');

function authIsOwner(req) {
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
    // 공통 데이터 가져오기
    fetchCommonData: (callback) => {
        const sql = 'SELECT * FROM boardtype; SELECT * FROM code;';
        db.query(sql, (err, results) => {
            if (err) {
                console.error('공통 데이터 가져오기 오류:', err);
                callback(err, null);
            } else {
                const boardtypes = results[0] || [];
                const codes = results[1] || [];
                callback(null, { boardtypes, codes });
            }
        });
    },

    // 구매 목록 보기
    list: (req, res) => {
        const { name, login, cls } = authIsOwner(req); // 사용자 인증 정보 가져오기
        const loginid = req.session.loginid; // 실제 로그인한 사용자의 ID
    
        if (!login) {
            return res.redirect('/login'); // 로그인 상태가 아니면 로그인 페이지로 리디렉션
        }
    
        const sqlPurchases = `
            SELECT pu.purchase_id, p.name, p.image, pu.price, pu.qty, pu.total, pu.date, pu.cancel
            FROM purchase pu
            JOIN product p ON pu.mer_id = p.mer_id
            WHERE pu.loginid = ?
            ORDER BY pu.date DESC
        `;
    
        module.exports.fetchCommonData((err, commonData) => {
            if (err) {
                console.error('공통 데이터 가져오는 중 오류:', err);
                return res.status(500).send('공통 데이터를 가져오는 중 오류가 발생했습니다.');
            }
    
            db.query(sqlPurchases, [loginid], (err, purchases) => { // 로그인한 사용자 기준 데이터 조회
                if (err) {
                    console.error('구매 목록 가져오기 오류:', err);
                    return res.status(500).send('구매 목록을 가져오는 중 오류가 발생했습니다.');
                }
    
                console.log('구매 데이터:', purchases); // 디버깅: 데이터 확인
    
                res.render('mainFrame', {
                    who: name,
                    login: login,
                    cls: cls,
                    body: 'purchase.ejs',
                    user: { loginid }, // 로그인한 사용자 정보
                    purchases: purchases, // 구매 데이터 전달
                    ...commonData,
                });
            });
        });
    },

    // 구매 처리
    purchase: (req, res) => {
        const { mer_id, qty } = req.body; // 요청으로부터 상품 ID와 수량 받기
        const { name, login, cls } = authIsOwner(req); // 사용자 인증 정보 가져오기
        const loginid = req.session.loginid; // 세션에서 로그인된 사용자 ID 가져오기
    
        // 입력 데이터 검증
        if (!loginid || !mer_id || !qty || isNaN(mer_id) || isNaN(qty)) {
            return res.status(400).send('유효하지 않은 데이터입니다.');
        }
    
        const now = new Date();
        const date = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} : ${String(now.getHours()).padStart(2, '0')}시 ${String(now.getMinutes()).padStart(2, '0')}분 ${String(now.getSeconds()).padStart(2, '0')}초`;
    
        module.exports.fetchCommonData((err, commonData) => {
            if (err) {
                console.error('공통 데이터 가져오는 중 오류:', err);
                return res.status(500).send('공통 데이터를 가져오는 중 오류가 발생했습니다.');
            }
    
            const sqlProduct = 'SELECT mer_id, price FROM product WHERE mer_id = ?';
            db.query(sqlProduct, [mer_id], (err, productResults) => {
                if (err || productResults.length === 0) {
                    console.error('상품 데이터 가져오는 중 오류:', err);
                    return res.status(500).send('상품 정보를 가져오는 중 오류가 발생했습니다.');
                }
    
                const product = productResults[0];
                const total = qty * product.price;
                const point = Math.floor(total * 0.1);
    
                const sqlInsert = `
                    INSERT INTO purchase (loginid, mer_id, date, price, point, qty, total, payYN, cancel, refund)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'Y', 'N', 'N')
                `;
    
                db.query(sqlInsert, [loginid, product.mer_id, date, product.price, point, qty, total], (err) => {
                    if (err) {
                        console.error('구매 정보 저장 중 오류:', err);
                        return res.status(500).send('구매 정보를 저장하는 중 오류가 발생했습니다.');
                    }
    
                    res.redirect('/purchase');
                });
            });
        });
    },        

    // 구매 취소 처리
    cancel: (req, res) => {
        const purchaseId = req.params.purchaseId;
        const { name, login, cls } = authIsOwner(req);
        const user = { loginid: req.session.name };

        if (!purchaseId) {
            return res.status(400).send('purchaseId가 제공되지 않았습니다.');
        }

        const sql = `
            UPDATE purchase
            SET cancel = 'Y'
            WHERE purchase_id = ? AND cancel = 'N'
        `;

        db.query(sql, [purchaseId], (err, result) => {
            if (err) {
                return res.status(500).send('구매 취소 처리 중 오류가 발생했습니다.');
            }

            if (result.affectedRows === 0) {
                return res.status(400).send('이미 취소된 상품이거나 잘못된 요청입니다.');
            }

            res.redirect('/purchase');
        });
    },

    // 상품 상세 보기
    detail: (req, res) => {
        const { name, login, cls } = authIsOwner(req);
        const user = { loginid: req.session.name };
        const merId = sanitizeHtml(req.params.merId);

        module.exports.fetchCommonData((err, commonData) => {
            if (err) {
                return res.status(500).send('공통 데이터를 가져오는 중 오류가 발생했습니다.');
            }

            const sqlProduct = 'SELECT mer_id, name, price, brand, image FROM product WHERE mer_id = ?';
            db.query(sqlProduct, [merId], (err, productResults) => {
                if (err || productResults.length === 0) {
                    return res.status(500).send('상품 정보를 가져오는 중 오류가 발생했습니다.');
                }

                const product = productResults[0];

                res.render('mainFrame', {
                    who: name,
                    login: login,
                    cls: cls,
                    body: 'purchaseDetail.ejs',
                    user: user,
                    product: product,
                    ...commonData,
                });
            });
        });
    },

    // 장바구니 추가
    cart: (req, res) => {
        const { mer_id } = req.body; // 요청된 상품 ID
        const { name, login, cls } = authIsOwner(req); // 세션에서 사용자 정보 가져오기
        const loginid = req.session.loginid; // 로그인된 사용자의 실제 loginid를 가져옴
    
        // 입력 데이터 검증
        if (!loginid || !mer_id || isNaN(mer_id)) {
            return res.status(400).send('유효하지 않은 데이터입니다.');
        }
    
        const checkSql = `
            SELECT * FROM cart
            WHERE loginid = ? AND mer_id = ?
        `;
    
        db.query(checkSql, [loginid, mer_id], (err, results) => {
            if (err) {
                console.error('장바구니 확인 중 오류:', err);
                return res.status(500).send('장바구니 확인 중 오류가 발생했습니다.');
            }
    
            if (results.length > 0) {
                // 이미 장바구니에 상품이 있는 경우 알림 표시
                return res.send(`
                    <script>
                        alert('장바구니에 이미 있는 제품입니다.');
                        window.location.href = '/purchase/cart';
                    </script>
                `);
            }
    
            const now = new Date();
            const date = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} : ${String(now.getHours()).padStart(2, '0')}시 ${String(now.getMinutes()).padStart(2, '0')}분 ${String(now.getSeconds()).padStart(2, '0')}초`;
    
            const sqlInsert = `
                INSERT INTO cart (loginid, mer_id, date)
                VALUES (?, ?, ?)
            `;
    
            db.query(sqlInsert, [loginid, mer_id, date], (err) => {
                if (err) {
                    console.error('장바구니 추가 중 오류:', err);
                    return res.status(500).send('장바구니 추가 중 오류가 발생했습니다.');
                }
    
                res.redirect('/purchase/cart');
            });
        });
    },                

    // 장바구니 보기
    viewCart: (req, res) => {
        const { name, login, cls } = authIsOwner(req); // 로그인 정보 가져오기
        const loginid = req.session.loginid; // 로그인된 사용자의 ID
    
        if (!loginid) {
            return res.redirect('/login'); // 로그인 상태가 아니면 로그인 페이지로 리디렉트
        }
    
        // 공통 데이터를 가져오기 위한 메소드 호출
        module.exports.fetchCommonData((err, commonData) => {
            if (err) {
                console.error('공통 데이터 가져오기 오류:', err);
                return res.status(500).send('공통 데이터를 가져오는 중 오류가 발생했습니다.');
            }
    
            // 장바구니 데이터를 조회하는 SQL 쿼리
            const sqlCart = `
                SELECT 
                    c.cart_id, 
                    c.date, 
                    p.name AS name, 
                    p.image AS image, 
                    p.price AS price
                FROM 
                    cart c
                JOIN 
                    product p ON c.mer_id = p.mer_id
                WHERE 
                    c.loginid = ?
                ORDER BY 
                    c.date DESC
            `;
    
            db.query(sqlCart, [loginid], (err, cartItems) => {
                if (err) {
                    console.error('장바구니 데이터 가져오기 오류:', err);
                    return res.status(500).send('장바구니 데이터를 가져오는 중 오류가 발생했습니다.');
                }
    
                // `cart.ejs` 파일과 일치하는 데이터 형식으로 렌더링
                res.render('mainFrame', {
                    who: name, // 사용자 이름
                    login: login, // 로그인 상태
                    cls: cls, // 사용자 권한
                    body: 'cart.ejs', // 포함될 EJS 파일
                    user: { loginid }, // 로그인된 사용자 정보
                    cartItems: cartItems, // 장바구니 데이터
                    ...commonData, // 공통 데이터 (boardtypes, codes)
                });
            });
        });
    },    

    purchaseCart: (req, res) => {
        const { loginid, mer_id, qty } = req.body;
        const { name, login, cls } = authIsOwner(req);
        const user = { loginid: req.session.name };
    
        if (!loginid || !mer_id || !qty || isNaN(mer_id) || isNaN(qty)) {
            return res.status(400).send('유효하지 않은 데이터입니다.');
        }
    
        const now = new Date();
        const date = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} : ${String(now.getHours()).padStart(2, '0')}시 ${String(now.getMinutes()).padStart(2, '0')}분 ${String(now.getSeconds()).padStart(2, '0')}초`;
    
        const sqlProduct = 'SELECT mer_id, price FROM product WHERE mer_id = ?';
        db.query(sqlProduct, [mer_id], (err, productResults) => {
            if (err || productResults.length === 0) {
                return res.status(500).send('상품 정보를 가져오는 중 오류가 발생했습니다.');
            }
    
            const product = productResults[0];
            const total = qty * product.price;
            const point = Math.floor(total * 0.1);
    
            const sqlInsert = `
                INSERT INTO purchase (loginid, mer_id, date, price, point, qty, total, payYN, cancel, refund)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'Y', 'N', 'N')
            `;
    
            db.query(sqlInsert, [loginid, product.mer_id, date, product.price, point, qty, total], (err) => {
                if (err) {
                    console.error('구매 정보 저장 중 오류:', err);
                    return res.status(500).send('구매 정보를 저장하는 중 오류가 발생했습니다.');
                }
    
                res.redirect('/purchase');
            });
        });
    },
    
    deleteCart: (req, res) => {
        const { cart_selection } = req.body;
        if (!cart_selection || cart_selection.length === 0) {
            return res.status(400).send('<script>alert("삭제할 상품을 선택해 주세요."); window.location.href="/purchase/cart";</script>');
        }
    
        const sql = 'DELETE FROM cart WHERE cart_id IN (?)';
        db.query(sql, [cart_selection], (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send('장바구니 항목 삭제 중 오류가 발생했습니다.');
            }
    
            res.redirect('/purchase/cart');
        });
    },
    
    checkout: (req, res) => {
        const { cart_selection } = req.body; // 선택된 cart_id 배열
        if (!cart_selection || (Array.isArray(cart_selection) && cart_selection.length === 0)) {
            return res.status(400).send(`
                <script>
                    alert('선택된 상품이 없습니다. 다시 선택해 주세요.');
                    window.location.href = '/purchase/cart';
                </script>
            `);
        }
    
        const cartIds = Array.isArray(cart_selection) ? cart_selection : [cart_selection]; // 배열로 처리
        const quantities = req.body;
    
        const now = new Date();
        const date = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} : ${String(now.getHours()).padStart(2, '0')}시 ${String(now.getMinutes()).padStart(2, '0')}분 ${String(now.getSeconds()).padStart(2, '0')}초`;
    
        const sqlFetchCartItems = `
            SELECT c.cart_id, c.mer_id, p.price 
            FROM cart c
            JOIN product p ON c.mer_id = p.mer_id
            WHERE c.cart_id IN (?)
        `;
    
        db.query(sqlFetchCartItems, [cartIds], (err, cartItems) => {
            if (err) {
                console.error('장바구니 상품 데이터 가져오기 오류:', err);
                return res.status(500).send('서버 오류가 발생했습니다.');
            }
    
            if (cartItems.length === 0) {
                return res.status(400).send(`
                    <script>
                        alert('선택된 상품을 찾을 수 없습니다.');
                        window.location.href = '/purchase/cart';
                    </script>
                `);
            }
    
            const purchaseData = cartItems.map((item) => {
                const qty = quantities[`quantity_${item.cart_id}`] || 1; // 기본 수량 1
                const total = qty * item.price;
                const point = Math.floor(total * 0.1);
    
                return [
                    req.session.name, // loginid
                    item.mer_id, // mer_id
                    date, // date
                    item.price, // price
                    point, // point
                    qty, // qty
                    total, // total
                    'Y', // payYN
                    'N', // cancel
                    'N', // refund
                ];
            });
    
            const sqlInsertPurchase = `
                INSERT INTO purchase (loginid, mer_id, date, price, point, qty, total, payYN, cancel, refund)
                VALUES ?
            `;
    
            db.query(sqlInsertPurchase, [purchaseData], (err) => {
                if (err) {
                    console.error('구매 데이터 저장 중 오류:', err);
                    return res.status(500).send('서버 오류가 발생했습니다.');
                }
    
                const sqlDeleteFromCart = `DELETE FROM cart WHERE cart_id IN (?)`;
                db.query(sqlDeleteFromCart, [cartIds], (err) => {
                    if (err) {
                        console.error('장바구니 삭제 중 오류:', err);
                        return res.status(500).send('장바구니 삭제 중 오류가 발생했습니다.');
                    }
    
                    // 구매 완료 후 바로 구매 목록 페이지로 리디렉트
                    res.redirect('/purchase');
                });
            });
        });
    }           
};
