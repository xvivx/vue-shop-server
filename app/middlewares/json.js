const bodyParser = require('body-parser');
const json = bodyParser.json();

module.exports = function(req, res, next) {
  // 没有content-type让过去，比如get请求
  if (!req.headers[`content-type`]) {
    return next();
  }
  
  if (!~req.headers[`content-type`].indexOf(`application/json`)) {
    return res.sendStatus(400);
  } else {
    json(req, res, next);
  }
};
