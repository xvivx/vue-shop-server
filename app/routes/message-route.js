const router = require('express').Router();
const oauth = require('../middlewares/oauth');
const { success } = require('../middlewares/status');
const { PkValue, removeEmptyProps } = require('../util');
const MESSAGE = require('../ali-oss/message');

async function get(req, res) {
  var username = req.app.locals.username;

  if (username !== `god`) {
    return res.json({
      status: `error`,
      error: `对不起，你权限不足`
    });
  }

  return res.json({
    status: `success`,
    data: await MESSAGE.get()
  });
}

async function add(req, res, next) {
  if (!req.body.content) {
    return res.json({
      status: `error`,
      error: `消息内容不能为空`
    });
  }

  var data = {
    content: req.body.content,
    subject: req.body.subject,
    name: req.body.name,
    phone: req.body.phone,
    email: req.body.email,
    from: req.app.locals.username,
    id: PkValue(),
    time: Date.now()
  };

  await MESSAGE.add(data);

  next();
}

async function del(req, res, next) {
  if (!req.body.id) {
    return res.json({
      status: `error`,
      error: `缺少留言信息ID`
    });
  }

  await MESSAGE.del(req.body.id);

  next();
}

router.post(`/add`, add, success);

router.use(oauth);

router.get(`/get`, get);
router.post(`/del`, del, success);

module.exports = router;
