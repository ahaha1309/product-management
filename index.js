const express = require('express');
const bodyParser = require('body-parser')
const flash=require('express-flash');
const path=require('path');
const moment=require('moment');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const database = require('./config/database');
require('dotenv').config();

const routes = require('./routes/client/index.router');
const systemConfig = require('./config/system');
const routerAdmin = require('./routes/admin/index.router');
database.connect();


const methodOverride = require('method-override');

const app = express();
const port = process.env.PORT;

app.use(methodOverride('_method'));
//tạo ra biến toàn cục để file pug nào cũng dùng đc
app.locals.prefixAdmin = systemConfig.prefixAdmin;
app.locals.moment = moment;

// body-parser để lấy dữ liệu từ form gửi lên
app.use(bodyParser.urlencoded());

app.use(express.static(`${__dirname}/public`));
app.set('views', `${__dirname}/views`);
app.set('view engine', 'pug');

//dùng req.flash để truyền biến messages 
app.use(cookieParser("keyboard cat"));
app.use(session({ cookie: { maxAge: 60000 } })); // Cấu hình session với thời gian sống là 60 giây
app.use(flash());
//tinymce
app.use('/tinymce', express.static(path.join(__dirname, 'node_modules', 'tinymce')));
//routers
routes(app);
routerAdmin(app);
app.listen(port, () => {
  console.log(`tao dang chay o port ${port}`);
});
