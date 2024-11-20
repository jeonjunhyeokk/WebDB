var db = require('./db');
var sanitizeHtml = require('sanitize-html');

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
    customeranal: (req, res) => {
        // 지역별 고객 분석 데이터 가져오기
        const sqlCustomerAnal = `
            SELECT 
                address, 
                ROUND((COUNT(*) / (SELECT COUNT(*) FROM person)) * 100, 2) AS rate
            FROM person
            GROUP BY address;
        `;
        const sqlCodes = 'SELECT * FROM code;';
        const sqlBoardTypes = 'SELECT * FROM boardtype;';

        // 지역별 고객 분석 쿼리
        db.query(sqlCustomerAnal, (error, customerResults) => {
            if (error) {
                console.error('Error fetching customer analysis data:', error);
                return res.status(500).send('데이터를 가져오는 중 오류가 발생했습니다.');
            }

            // 코드 데이터 쿼리
            db.query(sqlCodes, (error, codes) => {
                if (error) {
                    console.error('Error fetching codes data:', error);
                    return res.status(500).send('코드 데이터를 가져오는 중 오류가 발생했습니다.');
                }

                // 보드 타입 데이터 쿼리
                db.query(sqlBoardTypes, (error, boardtypes) => {
                    if (error) {
                        console.error('Error fetching boardtypes data:', error);
                        return res.status(500).send('보드 타입 데이터를 가져오는 중 오류가 발생했습니다.');
                    }

                    const { name, login, cls } = authIsOwner(req, res);

                    const percentage = customerResults.map(row => ({
                        address: row.address,
                        rate: row.rate
                    }));

                    const context = {
                        who: name,
                        login: login,
                        body: 'ceoAnal.ejs', // EJS 파일
                        cls: cls,
                        percentage: percentage, // 고객 분석 데이터
                        codes: codes, // 코드 데이터
                        boardtypes: boardtypes // 보드 타입 데이터
                    };

                    // EJS 렌더링
                    res.render('mainFrame', context, (err, html) => {
                        if (err) {
                            console.error('Error rendering page:', err);
                            return res.status(500).send('페이지 렌더링 중 오류가 발생했습니다.');
                        }
                        res.end(html);
                    });
                });
            });
        });
    },
};
