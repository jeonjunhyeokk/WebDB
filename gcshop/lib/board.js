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
    // 게시판 타입 목록 보기
    typeview: (req, res) => {
        const { name, login, cls } = authIsOwner(req);
        const sql = 'SELECT type_id, title, description, write_YN, re_YN, numPerPage FROM boardtype';
        const sqlCodes = 'SELECT * FROM code;'; // codes 쿼리 추가

        db.query(sql + '; ' + sqlCodes, (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).send('데이터를 가져오는 중 오류가 발생했습니다.');
            }
            const boardtypes = results[0];
            const codes = results[1]; // codes 결과 가져오기

            const context = {
                who: name,
                login: login,
                body: 'boardtype.ejs',
                cls: cls,
                boardtypes: boardtypes,
                codes: codes // codes 추가
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

    // 게시판 타입 추가 페이지
    typecreate: (req, res) => {
        const { name, login, cls } = authIsOwner(req);
        const sqlCodes = 'SELECT * FROM code;'; // codes 쿼리 추가

        db.query(sqlCodes, (error, codes) => {
            if (error) {
                console.error(error);
                return res.status(500).send('코드 데이터를 가져오는 중 오류가 발생했습니다.');
            }

            const context = {
                who: name,
                login: login,
                body: 'boardtypeCU.ejs',
                cls: cls,
                mode: 'create',
                boardtypes: [],  // 빈 배열 추가
                codes: codes // codes 추가
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

    // 게시판 타입 추가 처리
    typecreate_process: (req, res) => {
        const post = req.body;
        const sanitizedTitle = sanitizeHtml(post.title);
        const sanitizedDescription = sanitizeHtml(post.description);
        const sanitizedWriteYN = sanitizeHtml(post.write_YN);
        const sanitizedReYN = sanitizeHtml(post.re_YN);
        const sanitizedNumPerPage = parseInt(post.numPerPage, 10);

        const sqlInsert = `
            INSERT INTO boardtype (title, description, write_YN, re_YN, numPerPage) 
            VALUES (?, ?, ?, ?, ?)
        `;
        const params = [sanitizedTitle, sanitizedDescription, sanitizedWriteYN, sanitizedReYN, sanitizedNumPerPage];
        db.query(sqlInsert, params, (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send('게시판 타입 추가 중 오류가 발생했습니다.');
            }
            res.redirect('/board/type/view?type_id=' + result.insertId);
        });
    },

    // 게시판 타입 수정 페이지
    typeupdate: (req, res) => {
        const typeId = req.params.typeId; // URL 파라미터에서 가져오기
        const { name, login, cls } = authIsOwner(req);

        const sql1 = 'SELECT type_id, title, description, write_YN, re_YN, numPerPage FROM boardtype WHERE type_id = ?';
        const sql2 = 'SELECT * FROM code;'; // codes 쿼리 추가

        // 첫 번째 쿼리 실행
        db.query(sql1, [typeId], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).send('데이터를 가져오는 중 오류가 발생했습니다.');
            }

            const boardtypes = results || [];

            // 두 번째 쿼리 실행
            db.query(sql2, (err, codes) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('코드 데이터를 가져오는 중 오류가 발생했습니다.');
                }

                const context = {
                    who: name,
                    login: login,
                    body: 'boardtypeCU.ejs',
                    cls: cls,
                    boardtypes: boardtypes,
                    codes: codes, // codes 추가
                    mode: 'update'
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

    // 게시판 타입 수정 처리
    typeupdate_process: (req, res) => {
        const { type_id, title, description, write_YN, re_YN, numPerPage } = req.body;
        const sql = `
            UPDATE boardtype 
            SET title = ?, description = ?, write_YN = ?, re_YN = ?, numPerPage = ? 
            WHERE type_id = ?
        `;
        const params = [title, description, write_YN, re_YN, parseInt(numPerPage, 10), type_id];
        db.query(sql, params, (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send('게시판 타입 업데이트 중 오류가 발생했습니다.');
            }
            res.redirect('/board/type/view?type_id=' + type_id);
        });
    },

    // 게시판 타입 삭제 처리
    typedelete_process: (req, res) => {
        const typeId = req.params.typeId;  // URL 파라미터에서 type_id 가져오기

        // 게시판 타입 삭제 전에 해당 게시판의 게시글도 모두 삭제
        const deletePostsSQL = 'DELETE FROM board WHERE type_id = ?';
        db.query(deletePostsSQL, [typeId], (err) => {
            if (err) {
                console.error('게시글 삭제 중 오류:', err);
                return res.status(500).send('게시글 삭제 중 오류가 발생했습니다.');
            }

            // 게시판 타입 삭제
            const deleteBoardTypeSQL = 'DELETE FROM boardtype WHERE type_id = ?';
            db.query(deleteBoardTypeSQL, [typeId], (err) => {
                if (err) {
                    console.error('게시판 타입 삭제 중 오류:', err);
                    return res.status(500).send('게시판 타입 삭제 중 오류가 발생했습니다.');
                }
                res.redirect('/board/type/view');
            });
        });
    },

    // 게시판 목록 보기
    view: (req, res) => {
        const sntzedTypeId = sanitizeHtml(req.params.typeId); // URL의 typeId 가져오기
        const pNum = parseInt(req.params.pNum || 1, 10); // 페이지 번호 기본값 1
    
        // 필요한 쿼리 정의
        const sql1 = 'SELECT * FROM boardtype;';
        const sql2 = 'SELECT * FROM boardtype WHERE type_id = ?;';
        const sql3 = 'SELECT COUNT(*) AS total FROM board WHERE type_id = ?;';
        const sql4 = 'SELECT * FROM code;';
    
        // 병렬로 실행되는 쿼리
        db.query(sql1 + sql2 + sql3 + sql4, [sntzedTypeId, sntzedTypeId], (error, results) => {
            if (error) {
                console.error("Error fetching data:", error);
                return res.status(500).send('데이터를 가져오는 중 오류가 발생했습니다.');
            }
    
            // Auth 정보 가져오기
            const { name, login, cls } = authIsOwner(req);
    
            // 각 쿼리 결과 처리
            const boardtypes = results[0]; // 모든 게시판 유형
            const boardtype = results[1]?.[0]; // type_id에 해당하는 게시판 유형
            const total = results[2]?.[0]?.total || 0; // 총 게시물 수
            const codes = results[3]; // 코드 데이터
    
            // 게시판 유형 확인
            if (!boardtype) {
                return res.status(404).send('게시판 유형을 찾을 수 없습니다.');
            }
    
            // 페이징 처리
            const numPerPage = boardtype.numPerPage || 10; // 한 페이지당 게시물 수 (기본값: 10)
            const offs = (pNum - 1) * numPerPage;
            const totalPages = Math.ceil(total / numPerPage);
    
            // 게시물 가져오기 쿼리
            const sql5 = `
                SELECT b.board_id, b.title, b.date, p.name 
                FROM board b 
                INNER JOIN person p ON b.loginid = p.loginid 
                WHERE b.type_id = ? 
                ORDER BY date DESC 
                LIMIT ? OFFSET ?;
            `;
    
            // 게시물 데이터 쿼리 실행
            db.query(sql5, [sntzedTypeId, numPerPage, offs], (error2, boards) => {
                if (error2) {
                    console.error("Error fetching board data:", error2);
                    return res.status(500).send('게시판 데이터를 가져오는 중 오류가 발생했습니다.');
                }
    
                // 렌더링에 필요한 데이터 준비
                const context = {
                    who: name,
                    login: login,
                    body: 'board.ejs',
                    cls: cls,
                    boardtypes: boardtypes, // 모든 게시판 유형
                    boardtype: boardtype, // 현재 게시판 유형
                    codes: codes, // 코드 데이터
                    boards: boards || [], // 게시물 목록
                    totalPages: totalPages, // 총 페이지 수
                    pNum: pNum // 현재 페이지
                };
    
                // View 렌더링
                res.render('mainFrame', context, (err, html) => {
                    if (err) {
                        console.error("Rendering error:", err);
                        return res.status(500).send('페이지 렌더링 중 오류가 발생했습니다.');
                    }
                    res.end(html);
                });
            });
        });
    },

    // 게시판 작성 페이지
    create: (req, res) => {
        const sntzedTypeId = sanitizeHtml(req.params.typeId);
        const sql1 = 'SELECT * FROM boardtype;';
        const sql2 = 'SELECT * FROM boardtype WHERE type_id = ?;';
        const sql3 = 'SELECT * FROM code;'; // codes 쿼리 추가

        // 첫 번째 쿼리 실행
        db.query(sql1, (error, boardtypes) => {
            if (error) {
                console.error(error);
                return res.status(500).send('게시판 타입 데이터를 가져오는 중 오류가 발생했습니다.');
            }

            // 두 번째 쿼리 실행
            db.query(sql2, [sntzedTypeId], (error, boardtype) => {
                if (error) {
                    console.error(error);
                    return res.status(500).send('특정 게시판 타입 데이터를 가져오는 중 오류가 발생했습니다.');
                }

                // 세 번째 쿼리 실행
                db.query(sql3, (error, codes) => {
                    if (error) {
                        console.error(error);
                        return res.status(500).send('코드 데이터를 가져오는 중 오류가 발생했습니다.');
                    }

                    const { name, login, cls } = authIsOwner(req);
                    const sntzedLoginId = req.session.loginid; // 로그인 ID 추가

                    const context = {
                        who: name,
                        login: login,
                        body: 'boardCRU.ejs',
                        cls: cls,
                        boardtypes: boardtypes,
                        codes: codes, // codes 추가
                        boardtype: boardtype,
                        sntzedLoginId: sntzedLoginId, // sntzedLoginId 추가
                        mode: 'create'
                    };

                    res.render('mainFrame', context, (err, html) => {
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

    // 게시판 작성 처리
    create_process: (req, res) => {
        const board = req.body;
        const sntzedTypeId = sanitizeHtml(board.type_id);
        const sntzedLoginId = sanitizeHtml(board.loginid);
        const sntzedPassword = sanitizeHtml(board.password);
        const sntzedTitle = sanitizeHtml(board.title);
        const sntzedContent = sanitizeHtml(board.content);

        db.query('INSERT INTO board(type_id, p_id, loginid, password, title, date, content) VALUES(?, 0, ?, ?, ?, NOW(), ?)',
            [sntzedTypeId, sntzedLoginId, sntzedPassword, sntzedTitle, sntzedContent], (error, result) => {
                if (error) {
                    console.error(error);
                    return res.status(500).send('게시판 작성 중 오류가 발생했습니다.');
                }
                res.redirect(`/board/view/${sntzedTypeId}/1`);
            });
    },

    // 게시판 상세보기
    detail: (req, res) => {
        const sntzedBoardId = sanitizeHtml(req.params.boardId);
        const pNum = sanitizeHtml(req.params.pNum); // pNum을 URL 파라미터에서 가져오기
        const sql1 = 'SELECT * FROM boardtype;';
        const sql2 = `SELECT * FROM board INNER JOIN person ON board.loginid=person.loginid WHERE board_id=?;`;
        const sql3 = 'SELECT * FROM code;'; // codes 쿼리 추가

        // 첫 번째 쿼리 실행
        db.query(sql1, (error, boardtypes) => {
            if (error) {
                console.error(error);
                return res.status(500).send('게시판 타입 데이터를 가져오는 중 오류가 발생했습니다.');
            }

            // 두 번째 쿼리 실행
            db.query(sql2, [sntzedBoardId], (error, board) => {
                if (error) {
                    console.error(error);
                    return res.status(500).send('게시글 데이터를 가져오는 중 오류가 발생했습니다.');
                }

                // 세 번째 쿼리 실행
                db.query(sql3, (error, codes) => {
                    if (error) {
                        console.error(error);
                        return res.status(500).send('코드 데이터를 가져오는 중 오류가 발생했습니다.');
                    }

                    const { name, login, cls } = authIsOwner(req);
                    const sntzedLoginId = req.session.loginid; // 로그인 ID 추가

                    const context = {
                        who: name,
                        login: login,
                        body: 'boardCRU.ejs',
                        cls: cls,
                        boardtypes: boardtypes,
                        codes: codes, // codes 추가
                        board: board,
                        pNum: pNum, // pNum 추가
                        mode: 'read',
                        sntzedLoginId: sntzedLoginId, // sntzedLoginId 추가
                    };

                    res.render('mainFrame', context, (err, html) => {
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

    // 게시판 수정 페이지
    update: (req, res) => {
        const sntzedBoardId = sanitizeHtml(req.params.boardId);
        const sntzedTypeId = sanitizeHtml(req.params.typeId);
        const pNum = sanitizeHtml(req.params.pNum); // pNum을 URL 파라미터에서 가져오기
        const sql1 = 'SELECT * FROM boardtype;';
        const sql2 = 'SELECT * FROM boardtype WHERE type_id=?;';
        const sql3 = 'SELECT * FROM board INNER JOIN person ON board.loginid=person.loginid WHERE board_id=?;';
        const sql4 = 'SELECT * FROM code;'; // codes 쿼리 추가

        // 첫 번째 쿼리 실행
        db.query(sql1, (error, boardtypes) => {
            if (error) {
                console.error(error);
                return res.status(500).send('게시판 타입 데이터를 가져오는 중 오류가 발생했습니다.');
            }

            // 두 번째 쿼리 실행
            db.query(sql2, [sntzedTypeId], (error, boardtype) => {
                if (error) {
                    console.error(error);
                    return res.status(500).send('특정 게시판 타입 데이터를 가져오는 중 오류가 발생했습니다.');
                }

                // 세 번째 쿼리 실행
                db.query(sql3, [sntzedBoardId], (error, board) => {
                    if (error) {
                        console.error(error);
                        return res.status(500).send('게시글 데이터를 가져오는 중 오류가 발생했습니다.');
                    }

                    // 네 번째 쿼리 실행
                    db.query(sql4, (error, codes) => {
                        if (error) {
                            console.error(error);
                            return res.status(500).send('코드 데이터를 가져오는 중 오류가 발생했습니다.');
                        }

                        const { name, login, cls } = authIsOwner(req);
                        const sntzedLoginId = req.session.loginid; // 로그인 ID 추가

                        const context = {
                            who: name,
                            login: login,
                            body: 'boardCRU.ejs',
                            cls: cls,
                            boardtypes: boardtypes,
                            codes: codes, // codes 추가
                            boardtype: boardtype,
                            board: board,
                            pNum: pNum, // pNum 추가
                            mode: 'update',
                            sntzedLoginId: sntzedLoginId, // sntzedLoginId 추가
                        };

                        res.render('mainFrame', context, (err, html) => {
                            if (err) {
                                console.error(err);
                                return res.status(500).send('페이지 렌더링 중 오류가 발생했습니다.');
                            }
                            res.end(html);
                        });
                    });
                });
            });
        });
    },

    // 게시판 수정 처리
    update_process: (req, res) => {
        const board = req.body;
        const sntzedTitle = sanitizeHtml(board.title);
        const sntzedContent = sanitizeHtml(board.content);
        const sntzedBoardId = sanitizeHtml(board.board_id);
        const sntzedTypeId = sanitizeHtml(board.type_id);
        const sntzedPassword = sanitizeHtml(board.password);
        const pNum = board.pNum;

        db.query(`SELECT b.type_id as type_id, b.board_id as board_id, b.loginid as loginid, b.password as password, p.class as class
                  FROM board b INNER JOIN person p ON b.loginid=p.loginid WHERE b.board_id=? AND b.type_id=?`, [sntzedBoardId, sntzedTypeId], (error, board) => {
            if (error) {
                console.error(error);
                return res.status(500).send('데이터를 가져오는 중 오류가 발생했습니다.');
            }
            const { name, login, cls } = authIsOwner(req);
            if (cls === 'CST' && sntzedPassword !== board[0].password) {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(`<script language=JavaScript type="text/javascript">
                            alert("비밀번호가 일치하지 않습니다.");
                            setTimeout("location.href='http://localhost:3000/board/update/${sntzedBoardId}/${sntzedTypeId}/${pNum}'", 1000);
                         </script>`);
                return;
            }
            db.query('UPDATE board SET title=?, content=? WHERE board_id=? AND type_id=?',
                [sntzedTitle, sntzedContent, sntzedBoardId, sntzedTypeId], (error2) => {
                    if (error2) {
                        console.error(error2);
                        return res.status(500).send('게시판 수정 중 오류가 발생했습니다.');
                    }
                    res.redirect(`/board/detail/${sntzedBoardId}/${pNum}`);
                });
        });
    },

    // 게시판 삭제 처리
    delete_process: (req, res) => {
        const sntzedBoardId = sanitizeHtml(req.params.boardId);
        const sntzedTypeId = sanitizeHtml(req.params.typeId);
        db.query('DELETE FROM board WHERE board_id=? AND type_id=?', [sntzedBoardId, sntzedTypeId], (error) => {
            if (error) {
                console.error(error);
                return res.status(500).send('게시판 삭제 중 오류가 발생했습니다.');
            }
            res.redirect(`/board/view/${sntzedTypeId}/1`);
        });
    }
};