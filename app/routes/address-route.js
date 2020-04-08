const router = require('express').Router();
const { success } = require('../middlewares/status');
const { PkValue, removeEmptyProps } = require('../util');

const oauth = require('../middlewares/oauth');
const AREAS = require('../../data/address');
const ADDRESS = require('../ali-oss/address');

async function add(req, res, next) {
  var data = {
    id: PkValue(),
    username: req.app.locals.username,
    address: req.body.address,
    detail: req.body.detail,
    phone: req.body.phone,
    recipient: req.body.recipient,
    name: req.body.name,
    createTime: Date.now()
  };

  await ADDRESS.add(data);

  next();
}

async function get(req, res) {
  var all = await ADDRESS.get(req.app.locals.username);
  return res.json({
    status: `success`,
    data: all.filter((item) => item.username === req.app.locals.username)
  });
}

// TODO 验证订单是不是当前用户的
async function update(req, res, next) {
  var data = {
    ...req.body,
    updateTime: Date.now(),
    username: req.app.locals.username
  };

  await ADDRESS.update(removeEmptyProps(data));

  next();
}

function validateId(req, res, next) {
  if (!req.body.id) {
    return res.json({
      status: `error`,
      error: `缺少ID字段`
    });
  } else {
    next();
  }
}

async function del(req, res, next) {
  if (!req.body.id) {
    return next();
  }

  await ADDRESS.del({
    id: req.body.id,
    username: req.app.locals.username
  });

  next();
}

function areas(req, res) {
  res.setHeader(`Cache-Control`, `max-age=600000`);
  res.json({
    status: `success`,
    data: AREAS
  });
  return;
}

router.use(oauth);
router.get(`/common/areas`, areas);
router.post(`/common/add`, add, success);
router.get(`/common/get`, get);
router.post(`/common/update`, validateId, update, success);
router.post(`/common/delete`, validateId, del, success);

module.exports = router;
