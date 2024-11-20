var db = require('./db');
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

// 공통 데이터 가져오는 함수 추가
function fetchCommonData(callback) {
    const sqlCommon = 'SELECT * FROM boardtype; SELECT * FROM code;';
    db.query(sqlCommon, (err, results) => {
        if (err) {
            console.error('공통 데이터 가져오기 오류:', err);
            return callback(err, null);
        }
        const boardtypes = results[0] || [];
        const codes = results[1] || [];
        callback(null, { boardtypes, codes });
    });
}

module.exports = {
    view: (req, res) => {
        const sqlPurchase = `
            SELECT 
                pu.purchase_id,
                pu.loginid,
                pu.mer_id,
                pu.date,
                pu.price,
                pu.point,
                pu.qty,
                pu.total,
                pu.payYN,
                pu.cancel,
                pu.refund,
                pe.name AS customer_name,
                pr.name AS mer_name
            FROM 
                purchase pu
            LEFT JOIN 
                person pe ON pu.loginid = pe.loginid
            LEFT JOIN 
                product pr ON pu.mer_id = pr.mer_id
        `;

        fetchCommonData((err, commonData) => {
            if (err) {
                return res.status(500).send('공통 데이터를 가져오는 중 오류가 발생했습니다.');
            }

            db.query(sqlPurchase, (err, purchaseItems) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Database error');
                }

                const { name, login, cls } = authIsOwner(req, res);

                res.render('mainFrame', {
                    who: name,
                    login: login,
                    body: 'purchaseView', // purchaseView.ejs를 포함
                    cls: cls,
                    purchaseItems: purchaseItems, // purchase 데이터
                    ...commonData, // 공통 데이터 포함
                });
            });
        });
    },

    updateForm: (req, res) => {
        const purchaseId = req.params.purchase_id;
        const sqlPurchase = 'SELECT * FROM purchase WHERE purchase_id = ?';
        const sqlPersons = 'SELECT loginid, name FROM person'; // 고객 데이터
        const sqlProducts = 'SELECT mer_id, name FROM product'; // 상품 데이터

        fetchCommonData((err, commonData) => {
            if (err) {
                return res.status(500).send('공통 데이터를 가져오는 중 오류가 발생했습니다.');
            }

            db.query(`${sqlPurchase}; ${sqlPersons}; ${sqlProducts}`, [purchaseId], (err, results) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Database error');
                }

                const { name, login, cls } = authIsOwner(req, res);

                res.render('mainFrame', {
                    who: name,
                    login: login,
                    body: 'purchaseU', // 수정 폼 EJS
                    cls: cls,
                    purchase: results[0][0], // 구매 데이터
                    persons: results[1], // 고객 목록
                    products: results[2], // 상품 목록
                    ...commonData, // 공통 데이터 포함
                });
            });
        });
    },

    updateProcess: (req, res) => {
        const { purchase_id, loginid, mer_id, date, price, point, qty, total, payYN, cancel, refund } = req.body;
    
        const sql = `
            UPDATE purchase 
            SET loginid = ?, mer_id = ?, date = ?, price = ?, point = ?, qty = ?, total = ?, payYN = ?, cancel = ?, refund = ? 
            WHERE purchase_id = ?
        `;
    
        db.query(sql, [loginid, mer_id, date, price, point, qty, total, payYN, cancel, refund, purchase_id], (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Purchase update failed.');
            }
            res.redirect('/purchaseview'); // 업데이트 후 구매 목록으로 리디렉트
        });
    },
    

    deleteProcess: (req, res) => {
        const purchaseId = req.params.purchase_id;
        const sql = 'DELETE FROM purchase WHERE purchase_id = ?';

        db.query(sql, [purchaseId], (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Purchase deletion failed.');
            }
            res.redirect('/purchaseview'); // 삭제 후 /purchaseview로 리디렉트
        });
    }
};
