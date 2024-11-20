const db = require('./db');
const sanitizeHtml = require('sanitize-html');

function authIsOwner(req) {
    let name = 'Guest';
    let login = false;
    let cls = 'NON';
    if (req.session.is_logined) {
        name = req.session.name;
        login = true;
        cls = req.session.cls;
    }
    return { name, login, cls };
}

module.exports = {
    // 경영진 분석 화면
    ceoAnalysis: (req, res) => {
        const { name, login, cls } = authIsOwner(req);

        // 경영진만 접근 가능
        if (cls !== 'CEO') {
            return res.status(403).send('접근 권한이 없습니다.');
        }

        const sql1 = 'SELECT * FROM boardtype;';
        const sql2 = 'SELECT * FROM code;';
        const sql3 = `
            SELECT address, ROUND(COUNT(*) * 100 / (SELECT COUNT(*) FROM person), 2) AS rate 
            FROM person 
            GROUP BY address;
        `;

        db.query(sql1, (err, boardtypes) => {
            if (err) {
                console.error('boardtype 데이터를 가져오는 중 오류가 발생했습니다:', err);
                return res.status(500).send('boardtype 데이터를 가져오는 중 오류가 발생했습니다.');
            }

            db.query(sql2, (err, codes) => {
                if (err) {
                    console.error('code 데이터를 가져오는 중 오류가 발생했습니다:', err);
                    return res.status(500).send('code 데이터를 가져오는 중 오류가 발생했습니다.');
                }

                db.query(sql3, (err, percentages) => {
                    if (err) {
                        console.error('person 데이터를 가져오는 중 오류가 발생했습니다:', err);
                        return res.status(500).send('person 데이터를 가져오는 중 오류가 발생했습니다.');
                    }

                    const context = {
                        who: name,
                        login: login,
                        body: 'ceoAnal.ejs',
                        cls: cls,
                        boardtypes: boardtypes,
                        codes: codes,
                        percentage: percentages
                    };

                    res.render('mainFrame', context, (err, html) => {
                        if (err) {
                            console.error('페이지 렌더링 중 오류가 발생했습니다:', err);
                            return res.status(500).send('페이지 렌더링 중 오류가 발생했습니다.');
                        }
                        res.end(html);
                    });
                });
            });
        });
    },
};
