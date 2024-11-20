var mysql = require('mysql2');
var db = mysql.createConnection({
    host : 'localhost',
    user : 'root',
    password : 'root',
    database : 'webdb2024',
    multipleStatements : true  // 추가
});
db.connect();

module.exports = db;