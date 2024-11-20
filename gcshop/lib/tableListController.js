const db = require('./db');

// 세션 정보를 가져오는 공통 함수
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
    listTables: (req, res) => {
        const sql = `
            SELECT 
                table_name AS name, 
                table_comment AS description 
            FROM information_schema.tables 
            WHERE table_schema = 'webdb2024';
        `;

        // 세션 정보 가져오기
        const { name: who, login, cls } = authIsOwner(req);

        db.query(sql, (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).send('데이터베이스 오류가 발생했습니다.');
            }

            res.render('mainFrame', {
                body: 'tableManage', // 렌더링할 EJS 파일
                tables: results,
                boardtypes: [], // 기본값으로 빈 배열 전달
                codes: [], // 기본값으로 빈 배열 전달
                cls: cls, // cls 변수 전달
                who: who, // who 변수 전달
                login: login // login 변수 추가
            });
        });
    }
};

