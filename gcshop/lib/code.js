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
    return { name, login, cls }
}

module.exports = {
    view: (req, res) => {
        var sql1 = 'SELECT * FROM code;';
        var sql2 = 'SELECT * FROM boardtype;';
        db.query(sql1 + sql2, (error, results) => {
            if (error) { throw error; }
            var { name, login, cls } = authIsOwner(req, res);
            var codes = results[0];
            var boardtypes = results[1];

            var context = {
                who: name,
                login: login,
                body: 'code.ejs',
                cls: cls,
                boardtypes: boardtypes,
                codes: codes
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
    create: (req, res) => {
        const sql = 'SELECT * FROM boardtype; SELECT * FROM code';
        db.query(sql, (error, results) => {
            if (error) { throw error; }
            var { name, login, cls } = authIsOwner(req, res);
            var boardtypes = results[0];
            var codes = results[1];

            var context = {
                who: name,
                login: login,
                body: 'codeCU.ejs',
                cls: cls,
                boardtypes: boardtypes,
                codes: codes,
                mode: 'create' // codeCU.ejs 에 넘겨줄 변수
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
    create_process: (req, res) => {
        const post = req.body;
        const sanitizedMainId = sanitizeHtml(post.main_id);
        const sanitizedSubId = sanitizeHtml(post.sub_id);
        const sanitizedMainName = sanitizeHtml(post.main_name);
        const sanitizedSubName = sanitizeHtml(post.sub_name);
        const sanitizedStart = sanitizeHtml(post.start);
        const sanitizedEnd = sanitizeHtml(post.end);

        const sqlInsert = `
            INSERT INTO code (main_id, sub_id, main_name, sub_name, start, end) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const params = [sanitizedMainId, sanitizedSubId, sanitizedMainName, sanitizedSubName, sanitizedStart, sanitizedEnd];
        db.query(sqlInsert, params, (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send('코드 추가 중 오류가 발생했습니다.');
            }
            res.redirect('/code/view');
        });
    },

    update: (req, res) => {
        // URL에서 main, sub, start, end 값을 추출
        const { main, sub, start, end } = req.params;

        // 사용자 인증 정보 가져오기
        const { name, login, cls } = authIsOwner(req);

        // SQL 쿼리문 작성: 코드가 존재하는지 확인
        const sql = 'SELECT * FROM code WHERE main_id = ? AND sub_id = ? AND start = ? AND end = ?';
        db.query(sql, [main, sub, start, end], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).send('데이터를 가져오는 중 오류가 발생했습니다.');
            }

            // 해당하는 코드가 없으면 404 에러 반환
            if (results.length === 0) {
                return res.status(404).send('코드를 찾을 수 없습니다.');
            }

            // 수정할 코드와 함께 보드 타입 및 모든 코드 데이터 가져오기
            const sql2 = 'SELECT * FROM boardtype; SELECT * FROM code';
            db.query(sql2, (error, boardAndCodes) => {
                if (error) {
                    console.error(error);
                    return res.status(500).send('보드 타입을 가져오는 중 오류가 발생했습니다.');
                }

                const boardtypes = boardAndCodes[0];
                const codes = boardAndCodes[1];

                // 코드 수정 폼 렌더링
                const context = {
                    who: name,
                    login: login,
                    body: 'codeCU.ejs', // 수정 폼을 위한 EJS 파일
                    cls: cls,
                    code: results[0], // 수정할 코드 데이터
                    boardtypes: boardtypes, // 보드 타입 데이터
                    codes: codes, // 모든 코드 데이터
                    mode: 'update' // 수정 모드 표시
                };

                // 페이지 렌더링
                req.app.render('mainFrame', context, (err, html) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).send('페이지 렌더링 중 오류가 발생했습니다.');
                    }
                    res.end(html);
                });
            });
        });
    },

    update_process: (req, res) => {
        const { main_id, sub_id, main_name, sub_name, start, end } = req.body;
    
        // 배열에서 첫 번째 값만 가져오기
        const startValue = Array.isArray(start) ? start[0] : start;
        const endValue = Array.isArray(end) ? end[0] : end;
    
        const sql = `
            UPDATE code 
            SET main_name = ?, sub_name = ?, start = ?, end = ? 
            WHERE main_id = ? AND sub_id = ?
        `;
    
        // 파라미터 배열에 단일 값 사용
        const params = [main_name, sub_name, startValue, endValue, main_id, sub_id];
        console.log("Executing SQL:", sql);
        console.log("With parameters:", params);
    
        db.query(sql, params, (err) => {
            if (err) {
                console.error("SQL Error:", err);
                return res.status(500).send('코드 업데이트 중 오류가 발생했습니다.');
            }
            res.redirect('/code/view');
        });
    },

    delete_process: (req, res) => {
        const sql = 'SELECT * FROM code';
        db.query(sql, (error, codes) => {
            if (error) {
                console.error(error);
                return res.status(500).send('코드 데이터를 가져오는 중 오류가 발생했습니다.');
            }

            const { main, sub, start, end } = req.params;
            const sqlDelete = 'DELETE FROM code WHERE main_id = ? AND sub_id = ? AND start = ? AND end = ?';
            db.query(sqlDelete, [main, sub, start, end], (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('코드 삭제 중 오류가 발생했습니다.');
                }
                res.redirect('/code/view');
            });
        });
    },
}
