const router = require('express').Router();
const { success } = require('../middlewares/status');
const oauth = require('../middlewares/oauth');
var CART = require('../ali-oss/cart');
var COMMODITY = require('../ali-oss/commodity');

async function get(req, res) {
  var carts = await CART.get(req.app.locals.username);

  if (carts.length) {
    var commodities = await COMMODITY.get();

    carts = carts.map((item) => {
      var data = commodities.find((commod) => item.id === commod.id);

      return {
        ...data,
        count: item.count
      };
    });
  }

  return res.json({
    status: `success`,
    data: carts
  });
}

async function add(req, res, next) {
  const data = { ...req.body };

  if (!data.id) {
    return res.json({
      status: `error`,
      error: `缺少商品ID`
    });
  }

  if (data.count - parseInt(data.count) !== 0) {
    return res.json({
      status: `error`,
      error: `商品数量不合法`
    });
  }

  await CART.add(
    {
      id: req.body.id,
      count: Number(data.count)
    },
    req.app.locals.username
  );

  next();
}

async function del(req, res, next) {
  var username = req.app.locals.username;
  var ids = (req.body.id || '').split(',');

  if (!ids.length) {
    return res.json({
      status: `error`,
      error: `缺少商品ID`
    });
  }

  if (ids.length > 1) {
    await CART.delMult(ids, username);
  } else {
    await CART.del(ids[0], username);
  }

  next();
}

async function clear(req, res, next) {
  await CART.clear(req.app.locals.username);
  next();
}

router.use(oauth);

router.get(`/get`, get);
router.post(`/add`, add, success);
router.post(`/del`, del, success);
router.post(`/clear`, clear, success);

module.exports = router;
