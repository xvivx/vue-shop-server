var TOKEN = require('../ali-oss/token');

module.exports = async function(req, res, next) {
  var token = req.header(`token`);

  if (!token) {
    return next();
  }

  var tokens = (await TOKEN.get()) || {};
  var { username, expired, role } = tokens[token] || {};

  // 新鲜TOKEN
  if (expired - Date.now() > 0) {
    await TOKEN.update({
      [token]: {
        username,
        role: role,
        expired: Date.now() + 2000 * 3600
      }
    });

    req.app.locals.username = username;
    req.app.locals.role = role;

  } else {
    // 过期了
    TOKEN.del(token);
  }

  return next();
};
