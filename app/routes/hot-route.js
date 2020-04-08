const router = require('express').Router();
const oauth = require('../middlewares/oauth');
const manage = require('../middlewares/manage');
const { success } = require('../middlewares/status');

// 数据库操作，统一大些
const COMMODITY = require('../ali-oss/commodity');

async function get(req, res) {
  var all = await COMMODITY.get();

  return res.json({
    status: `success`,
    data: all.filter((item) => item.hot)
  });
}

async function del(req, res, next) {
  if (!req.body.id) {
    return res.json({
      status: `error`,
      error: `缺少商品ID`
    });
  }

  var all = await COMMODITY.get();

  var found = all.find((item) => item.id === req.body.id);

  if (!found) {
    return res.json({
      status: `erorr`,
      error: `您删除的热销商品不存在`
    });
  }

  found.hot = false;

  await COMMODITY.update(found);

  next();
}

async function add(req, res, next) {
  if (!req.body.id) {
    return res.json({
      status: `error`,
      error: `缺少商品ID`
    });
  }

  var all = await COMMODITY.get();

  var found = all.find((item) => item.id === req.body.id);

  if (!found) {
    return res.json({
      status: `erorr`,
      error: `您添加的热销商品不存在`
    });
  }

  found.hot = true;

  await COMMODITY.update(found);

  next();
}

router.get(`/get`, get);
router.use(oauth, manage);
router.post(`/del`, del, success);
router.post(`/add`, add, success);

module.exports = router;
