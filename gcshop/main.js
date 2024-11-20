//202035226 전준혁

const express = require('express');
var session = require('express-session');
var MySqlStore = require('express-mysql-session')(session);
var bodyParser = require('body-parser');
var options = {
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'webdb2024'
};

var sessionStore = new MySqlStore(options);
const app = express();

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    store: sessionStore
}));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));

const rootRouter = require('./router/rootRouter');
const authRouter = require('./router/authRouter');
const codeRouter = require('./router/codeRouter');
const productRouter = require('./router/productRouter');
const personRouter = require('./router/personRouter');
const boardRouter = require('./router/boardRouter');
const purchaseRouter = require('./router/purchaseRouter');
const analyticRouter = require('./router/analyticRouter');
const cartViewRouter = require('./router/cartViewRouter');
const purchaseviewRouter = require('./router/purchaseviewRouter');
const tableManageRouter = require('./router/tableManageRouter');

app.use('/', rootRouter);
app.use('/auth', authRouter);
app.use('/code', codeRouter);
app.use('/product', productRouter);
app.use('/person', personRouter);
app.use('/board', boardRouter);
app.use('/purchase',purchaseRouter);
app.use('/analytic', analyticRouter);
app.use('/cart', cartViewRouter);
app.use('/purchaseview', purchaseviewRouter); 


app.get('/favicon.ico', (req, res) => res.writeHead(404));
app.use('/tablemanage', tableManageRouter);

app.listen(3000, () => console.log('Example app listening on port 3000'));