const path = require('path');
const express = require('express');
const history = require('connect-history-api-fallback');
const json = require('./middlewares/json');

// 处理异步异常错误
require('express-async-errors');

// 数据
const banner = require('./routes/banner-route');
const classification = require('./routes/classification-route');
const category = require('./routes/category-route');
const user = require('./routes/user-route');
const commodity = require('./routes/commodity-route');
const address = require('./routes/address-route');
const order = require('./routes/order-route');
const cart = require('./routes/cart-route');
const message = require('./routes/message-route');
const hot = require('./routes/hot-route');
const graphql = require('./graphql');
const { unhandledRejection } = require('./util');

process.on('unhandledRejection', unhandledRejection);

// 初始化程序
const app = express();


// 跨域处理
app.all('*', function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type,token');
  res.header('Access-Control-Allow-Methods', '*');
  if (req.method.toUpperCase() === `OPTIONS`) {
    return res.sendStatus(200);
  } else {
    return next();
  }
});

// 使用graphql处理接口
app.use(`/graphql`, require('./middlewares/oauth-graphql'), graphql);

app.get(`/healthy`, function(req, res) {
  return res.sendStatus(200);
});
// 这几个路由涉及到文件上传，所以使用form
app.use(`/commodity`, commodity);
app.use(`/category`, category);
app.use(`/user`, user);
app.use(`/banner`, banner);

// 以下路由均使用json中间件
app.use(json);

app.use('/cart', cart);
app.use(`/address`, address);
app.use('/message', message);

app.use(`/order`, order);
app.use('/classification', classification);
app.use('/hot', hot);

// spa重定向index
if (process.env.NODE_ENV !== `production`) {
  app.use(history());
  app.use(express.static(path.resolve(__dirname, './static')));
}

// 404
app.use(function(req, res) {
  res.status(404);
  res.json({
    status: `404`,
    error: `404未找到资源`
  });
});

// 500 error handler (middleware)
app.use(function(err, req, res, next) {
  unhandledRejection(err);
  res.json({
    status: `error`,
    error: err.message || `服务器发生异常错误`,
  });
});

module.exports = app;
