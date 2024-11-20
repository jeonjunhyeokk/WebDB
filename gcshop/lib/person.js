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
    view: (req, res) => {
        const { name, login, cls } = authIsOwner(req);
        const sql1 = 'SELECT * FROM person';
        const sql2 = 'SELECT * FROM boardtype';
        const sql3 = 'SELECT * FROM code';
        db.query(sql1, (err, personResults) => {
            if (err) {
                console.error(err);
                return res.status(500).send('데이터를 가져오는 중 오류가 발생했습니다.');
            }
            db.query(sql2, (err, boardtypeResults) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('데이터를 가져오는 중 오류가 발생했습니다.');
                }
                db.query(sql3, (err, codes) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).send('데이터를 가져오는 중 오류가 발생했습니다.');
                    }
                    const context = {
                        who: name,
                        login: login,
                        body: 'person.ejs',
                        cls: cls,
                        person: personResults,
                        boardtypes: boardtypeResults,
                        codes: codes
                    };
                    req.app.render('mainFrame', context, (err, html) => {
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

    create: (req, res) => {
        db.query('SELECT * FROM boardtype; SELECT * FROM code;', (error, results) => {
            if (error) {
                console.error(error);
                return res.status(500).send('데이터를 가져오는 중 오류가 발생했습니다.');
            }
            const { name, login, cls } = authIsOwner(req);
            const boardtypes = results[0];
            const codes = results[1];
            const context = {
                who: name,
                login: login,
                body: 'personC.ejs',
                cls: cls,
                mode: 'create',
                boardtypes: boardtypes,
                codes: codes
            };
            req.app.render('mainFrame', context, (err, html) => {
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
        const sanitizedLoginId = sanitizeHtml(post.loginid);
        const sanitizedPassword = sanitizeHtml(post.password);
        const sanitizedName = sanitizeHtml(post.name);
        const sanitizedAddress = sanitizeHtml(post.address);
        const sanitizedTel = sanitizeHtml(post.tel);
        const sanitizedBirth = sanitizeHtml(post.birth);
        const sanitizedClass = sanitizeHtml(post.class);
        const sanitizedGrade = sanitizeHtml(post.grade);
        const sqlInsert = `
            INSERT INTO person (loginid, password, name, address, tel, birth, class, grade) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [sanitizedLoginId, sanitizedPassword, sanitizedName, sanitizedAddress, sanitizedTel, sanitizedBirth, sanitizedClass, sanitizedGrade];
        db.query(sqlInsert, params, (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send('사람 추가 중 오류가 발생했습니다.');
            }
            res.redirect('/person/view');
        });
    },

    update: (req, res) => {
        const { loginId } = req.params;
        db.query('SELECT * FROM boardtype; SELECT * FROM code;', (error, results) => {
            if (error) {
                console.error(error);
                return res.status(500).send('데이터를 가져오는 중 오류가 발생했습니다.');
            }
            const boardtypes = results[0];
            const codes = results[1];
            const { name, login, cls } = authIsOwner(req);
            const sql = 'SELECT * FROM person WHERE loginid = ?';
            db.query(sql, [loginId], (err, results) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('데이터를 가져오는 중 오류가 발생했습니다.');
                }
                if (results.length === 0) {
                    return res.status(404).send('사람을 찾을 수 없습니다.');
                }
                const context = {
                    who: name,
                    login: login,
                    body: 'personU.ejs',
                    cls: cls,
                    person: results[0],
                    mode: 'update',
                    boardtypes: boardtypes,
                    codes: codes
                };
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
        const { loginId, password, name, address, tel, birth, class: classValue, grade } = req.body;
        const sql = `
            UPDATE person 
            SET password = ?, name = ?, address = ?, tel = ?, birth = ?, class = ?, grade = ? 
            WHERE loginid = ?
        `;
        const params = [password, name, address, tel, birth, classValue, grade, loginId];
        db.query(sql, params, (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send('사람 업데이트 중 오류가 발생했습니다.');
            }
            res.redirect('/person/view');
        });
    },

    delete_process: (req, res) => {
        const { loginId } = req.params;
        const sql = 'DELETE FROM person WHERE loginid = ?';
        db.query(sql, [loginId], (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send('사람 삭제 중 오류가 발생했습니다.');
            }
            res.redirect('/person/view');
        });
    },
};
