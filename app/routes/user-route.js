const multer = require('multer');
const router = require('express').Router();
const OSS = require('../ali-oss/oss');
const oauth = require('../middlewares/oauth');
const json = require('../middlewares/json');
const { success } = require('../middlewares/status');
const { uuid } = require('../util');
const USER = require('../ali-oss/user');
const TOKEN = require('../ali-oss/token');
const { ASSETS_DOMAIN } = require('../const');

const upload = multer().single('file');

async function logout(req, res, next) {
  var token = req.header(`token`);

  if (token) {
    await TOKEN.del(token);
  }

  return next();
}

async function checkUsername(req, res, next) {
  if (!req.query.username) {
    return res.json({
      status: `error`,
      error: `用户名不能为空`
    });
  }

  var user = await USER.get(req.query.username);

  if (user) {
    res.json({
      status: `error`,
      error: `用户已经存在`
    });

    return;
  } else {
    next();

    return;
  }
}

async function userInfo(req, res) {
  var tokens = await TOKEN.get();
  var token = tokens[req.header('token')];

  var user = await USER.get(token.username);
  var data = { ...user };
  
  delete data.password;

  return res.json({
    status: `success`,
    data: data
  });
}

async function login(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  if (!username || !password) {
    return res.json({
      status: `error`,
      error: `用户名和密码不能为空`
    });
  }

  var user = await USER.get(username);

  if (!user) {
    res.json({
      status: `error`,
      error: `用户名不存在`
    });

    return;
  }

  if (user.password !== password) {
    res.json({
      status: `error`,
      error: `用户名或密码错误`
    });

    return;
  }

  var token = uuid();

  await TOKEN.add({
    id: token,
    expired: Date.now() + 2 * 3600 * 1000,
    username: username,
    role: user.role
  });

  res.json({
    status: `success`,
    token: token
  });

  return;
}

async function sign(req, res, next) {
  var username = req.body.username;
  var user = await USER.get(username);

  if (user) {
    res.json({
      status: `error`,
      error: `用户已经存在`
    });

    return;
  } else {
    await USER.add({
      username: username,
      password: req.body.password,
      role: `C`,
      createTime: Date.now()
    });

    next();
    return;
  }
}

async function update(req, res, next) {
  delete req.body.role;
  delete req.body.password;

  var data = {
    ...req.body,
    username: req.app.locals.username,
    updateTime: Date.now()
  };

  await USER.update(data);

  next();
}

async function handleUpload(req, res, next) {
  var data = {
    username: req.app.locals.username
  };

  var user = await USER.get(data.username);

  if (req.file && req.file.mimetype) {
    var type = req.file.mimetype.split('/').slice(-1)[0] || 'png';
    var filename = `static/users/${Math.random()
      .toString(26)
      .slice(2)}.${type}`;

    // 写入OSS文件
    if (user.avatar) {
      OSS.del(user.avatar.replace(`${ASSETS_DOMAIN}/`, ''));
    }

    await OSS.put(filename, req.file.buffer);

    data.avatar = `${ASSETS_DOMAIN}/${filename}`;
  } else {
    return res.json({
      status: `error`,
      error: `缺少图片信息`
    });
  }

  await USER.update(data);

  next();
}

router.post(`/common/upload`, oauth, upload, handleUpload, success);
router.use(json);
router.post('/login', login);
router.post('/sign-up', sign, success);
router.get(`/logout`, logout, success);
router.get(`/check`, checkUsername, success);
router.get(`/info`, oauth, userInfo);
router.post(`/common/update`, oauth, update, success);

module.exports = router;
