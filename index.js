const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const Chat = require('./models/chat.model');
const bodyParser = require('body-parser')
const flash=require('express-flash');
const path=require('path');
const moment=require('moment');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const database = require('./config/database');
require('dotenv').config();
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const routes = require('./routes/client/index.router');
const systemConfig = require('./config/system');
const routerAdmin = require('./routes/admin/index.router');

// Ép Node.js ưu tiên IPv4 để sửa lỗi treo (xoay xoay) khi gọi API Facebook/Google
const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');

const methodOverride = require('method-override');
const passport = require('./config/passport');

const app = express();
const port = process.env.PORT;

// Kết nối Database middleware (Tối ưu cho Serverless)
app.use(async (req, res, next) => {
  try {
    await database.connect();
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Database connection failed. Please check MongoDB IP whitelist.' });
  }
});

app.use(methodOverride('_method'));
//tạo ra biến toàn cục để file pug nào cũng dùng đc
app.locals.prefixAdmin = systemConfig.prefixAdmin;
app.locals.moment = moment;

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  referrerPolicy: false
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 1000, // Tối đa 1000 request / 15 phút
  message: "Quá nhiều request từ IP này, vui lòng thử lại sau 15 phút."
});
app.use(limiter);

// body-parser để lấy dữ liệu từ form gửi lên (Giới hạn payload 10MB)
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));

app.use(mongoSanitize()); // Chống NoSQL Injection
app.use(xss()); // Chống XSS

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Tối đa 5 lần thử
  message: "Quá nhiều lần đăng nhập sai, vui lòng thử lại sau 15 phút."
});
app.use('/auth/login', authLimiter);
app.use(`/${systemConfig.prefixAdmin}/auth/login`, authLimiter);

app.use(express.static(`${__dirname}/public`));
app.set('views', `${__dirname}/views`);
app.set('view engine', 'pug');

//dùng req.flash để truyền biến messages 
app.use(cookieParser("keyboard cat"));
app.use(session({ 
  secret: process.env.SESSION_SECRET || 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 86400000, // 24 giờ
    httpOnly: true, // Chống XSS lấy cookie
    secure: false, // True nếu dùng HTTPS
    sameSite: 'lax' // Chống CSRF cơ bản
  }
}));
app.use(flash());

// ===== PASSPORT =====
app.use(passport.initialize());
app.use(passport.session());

//tinymce
app.use('/tinymce', express.static(path.join(__dirname, 'node_modules', 'tinymce')));

// ===== GOOGLE OAuth Routes =====
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/login', failureFlash: true }),
  (req, res) => {
    // Đăng nhập thành công → set cookie token
    res.cookie('token', req.user.token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
    });
    res.redirect('/');
  }
);

// ===== FACEBOOK OAuth Routes =====
app.get('/auth/facebook', (req, res, next) => {
  console.log('Initiating FB Login...');
  next();
}, passport.authenticate('facebook', { scope: ['email', 'public_profile'] }));

app.get('/auth/facebook/callback', (req, res, next) => {
  console.log('FB Callback hit!');
  next();
}, passport.authenticate('facebook', { failureRedirect: '/auth/login', failureFlash: true }),
  (req, res) => {
    console.log('FB Callback success!');
    res.cookie('token', req.user.token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
    });
    res.redirect('/');
  }
);

//routers
routerAdmin(app);
routes(app);

// Socket.io Setup
const server = http.createServer(app);
const io = new Server(server);
global._io = io; // Dùng io ở nơi khác nếu cần

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Lắng nghe sự kiện gửi tin nhắn từ Client/Admin
  socket.on('CLIENT_SEND_MESSAGE', async (data) => {
    try {
      const chat = new Chat({
        userId: data.userId,
        content: data.content,
        isAdmin: data.isAdmin || false
      });
      await chat.save();
      
      // Emit lại tin nhắn cho tất cả client để hiển thị
      io.emit('SERVER_RETURN_MESSAGE', {
        userId: data.userId,
        content: data.content,
        isAdmin: data.isAdmin || false,
        createdAt: chat.createdAt
      });
    } catch (error) {
      console.log('Error saving chat:', error);
    }
  });

  // Lắng nghe yêu cầu lấy lịch sử chat
  socket.on('CLIENT_FETCH_HISTORY', async (data) => {
    try {
      if(data.userId) {
        const history = await Chat.find({ userId: data.userId, deleted: false }).sort({ createdAt: 1 });
        socket.emit('SERVER_RETURN_HISTORY', history);
      }
    } catch (error) {
      console.log('Error fetching chat history:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Global Error Handler (404)
app.use((req, res, next) => {
  res.status(404).render('client/pages/404', {
    pageTitle: '404 - Không tìm thấy trang'
  });
});

// Global Error Handler (500)
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).render('client/pages/500', {
    pageTitle: '500 - Lỗi hệ thống'
  });
});

if (process.env.NODE_ENV !== 'production') {
  server.listen(port, () => {
    console.log(`tao dang chay o port ${port} voi socket.io`);
  });
}

module.exports = app;

