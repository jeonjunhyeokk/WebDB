const db = require('./db');
const sanitizeHtml = require('sanitize-html');

// 세션 정보를 가져오는 공통 함수
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
    viewTableData: (req, res) => {
        const tableName = req.params.tableName;

        // 테이블 이름을 검증하고 sanitize 처리
        const sanitizedTableName = sanitizeHtml(tableName);

        // SQL 문을 템플릿 리터럴이 아닌 '?' 바인딩 방식으로 작성
        const sql = `SELECT * FROM ??`;

        const { name: who, login, cls } = authIsOwner(req);

        db.query(sql, [sanitizedTableName], (err, results, fields) => {
            if (err) {
                console.error(err);
                return res.status(500).send('데이터베이스 오류가 발생했습니다.');
            }

            const columns = fields.map(field => field.name);

            res.render('mainFrame', {
                body: 'tableView',
                tableName: sanitizedTableName,
                columns: columns,
                rows: results,
                boardtypes: [],
                codes: [],
                cls: cls,
                who: who,
                login: login,
            });
        });
    },
};
