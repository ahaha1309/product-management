const express = require('express');
const router = express.Router();

// [GET] /about
router.get('/', (req, res) => {
  const isLogin = req.cookies.token ? true : false;
  res.render('client/pages/about/index', {
    title: 'Giới thiệu - VanHa Tech Store',
    isLogin
  });
});

module.exports = router;
