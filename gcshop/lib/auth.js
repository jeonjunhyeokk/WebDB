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
    login: (req, res) => {
        const sql = 'SELECT * FROM boardtype; SELECT * FROM code;';
        db.query(sql, (error, results) => {
            if (error) {
                console.error(error);
                return res.status(500).send('데이터를 가져오는 중 오류가 발생했습니다.');
            }
            var { name, login, cls } = authIsOwner(req, res);

            const boardtypes = results[0] || [];
            const codes = results[1] || [];

            var context = {
                who: name,
                login: login,
                body: 'login.ejs',
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

    login_process: (req, res) => {
        var post = req.body;
        var sntzedLoginid = sanitizeHtml(post.loginid);
        var sntzedPassword = sanitizeHtml(post.password);

        db.query('SELECT count(*) AS num FROM person WHERE loginid = ? AND password = ?',
            [sntzedLoginid, sntzedPassword], (error, results) => {
                if (error) {
                    console.error(error);
                    return res.status(500).send('로그인 처리 중 오류가 발생했습니다.');
                }

                if (results[0].num === 1) {
                    db.query('SELECT name, class, loginid, grade FROM person WHERE loginid = ? AND password = ?',
                        [sntzedLoginid, sntzedPassword], (error, result) => {
                            if (error) {
                                console.error(error);
                                return res.status(500).send('사용자 정보 조회 중 오류가 발생했습니다.');
                            }

                            req.session.is_logined = true;
                            req.session.loginid = result[0].loginid;
                            req.session.name = result[0].name;
                            req.session.cls = result[0].class;
                            req.session.grade = result[0].grade;

                            res.redirect('/');
                        });
                } else {
                    req.session.is_logined = false;
                    req.session.name = 'Guest';
                    req.session.cls = 'NON';

                    res.send(`
                        <script>
                            alert('아이디 또는 비밀번호가 잘못되었습니다.');
                            window.location.href = '/auth/login';
                        </script>
                    `);
                }
            });
    },

    logout_process: (req, res) => {
        req.session.destroy((err) => {
            res.redirect('/');
        });
    },

    register: (req, res) => {
        const sql = 'SELECT * FROM boardtype; SELECT * FROM code;';
        db.query(sql, (error, results) => {
            if (error) {
                console.error(error);
                return res.status(500).send('데이터를 가져오는 중 오류가 발생했습니다.');
            }

            if (req.session.is_logined) {
                res.redirect('/');
                return;
            }

            var { name, login, cls } = authIsOwner(req, res);

            const boardtypes = results[0] || [];
            const codes = results[1] || [];

            var context = {
                who: name,
                login: login,
                body: 'personC.ejs',
                cls: cls,
                boardtypes: boardtypes,
                codes: codes,
                userClass: 'CST',
                grade: 'S'
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

    register_process: (req, res) => {
        var post = req.body;
        var sntzedLoginid = sanitizeHtml(post.loginid);
        var sntzedPassword = sanitizeHtml(post.password);
        var sntzedName = sanitizeHtml(post.name);
        var sntzedAddress = sanitizeHtml(post.address);
        var sntzedTel = sanitizeHtml(post.tel);
        var sntzedBirth = sanitizeHtml(post.birth);

        const userClass = 'CST';
        const grade = 'S';

        const sqlCheck = 'SELECT count(*) AS num FROM person WHERE loginid = ?';
        db.query(sqlCheck, [sntzedLoginid], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).send('회원 가입 중 오류가 발생했습니다.');
            }

            if (results[0].num > 0) {
                req.session.is_logined = false;
                req.session.name = 'Guest';
                req.session.cls = 'NON';
                return res.status(400).send('이미 존재하는 아이디입니다.');
            }

            const sqlInsert = `
                INSERT INTO person (loginid, password, name, address, tel, birth, class, grade) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            var params = [sntzedLoginid, sntzedPassword, sntzedName, sntzedAddress, sntzedTel, sntzedBirth, userClass, grade];
            db.query(sqlInsert, params, (err, results) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('회원 가입 중 오류가 발생했습니다.');
                }
                req.session.is_logined = true;
                req.session.loginid = sntzedLoginid;
                req.session.name = sntzedName;
                req.session.cls = userClass;
                req.session.grade = grade;
                res.redirect('/');
            });
        });
    }
};