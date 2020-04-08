var TOKEN = require('../ali-oss/token');

module.exports = async function(req, res, next) {
  var token = req.header(`token`);

  if (!token) {
    return res.json({
      status: `loginerror`,
      error: `未登录`
    });
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
    return next();
  } else {
    // 过期了
    await TOKEN.del(token);
  }

  return res.json({
    status: `loginerror`,
    error: `登录已过期，请重新登录`
  });
};
