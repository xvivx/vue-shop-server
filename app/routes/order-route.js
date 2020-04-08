const router = require('express').Router();
const { success } = require('../middlewares/status');
const oauth = require('../middlewares/oauth');
const { PkValue, uuid } = require('../util');
const ORDER = require('../ali-oss/order');
const COMMODITY = require('../ali-oss/commodity');
const CART = require('../ali-oss/cart');
const SALE = require('../ali-oss/sale');

async function add(req, res) {
  var shipId = req.body.shipId;

  if (!shipId) {
    return res.json({
      status: `error`,
      error: `不能缺少收货地址`
    });
  }

  var username = req.app.locals.username;
  var commodities = req.body.commodities || [];

  if (commodities.length === 0) {
    return res.json({
      status: `error`,
      error: `商品不能为空`
    });
  }

  var allCommodities = await COMMODITY.get();
  var orders = [];
  var now = Date.now();
  var note = req.body.note;

  commodities.forEach((commodity) => {
    var current = allCommodities.find((item) => item.id === commodity.id);

    if (!current) {
      return;
    }

    orders.push({
      id: PkValue(),
      commodityId: current.id,
      createTime: now,
      discount: (current.price - (current.discounted || 0)) * commodity.count,
      price: (current.discounted || current.price) * commodity.count,
      shipId,
      status: `未支付`,
      count: commodity.count,
      commodityName: current.name,
      commodityImage: current.image,
      note: note,
      username: username
    });
  });

  await ORDER.add(orders);
  await CART.delMult(
    orders.map((item) => item.commodityId),
    username
  );

  return res.json({
    status: `success`,
    data: orders
  });
}

var orders = [
  {
    orderId: `订单ID`,
    username: 'GOD',
    commodityId: '商品ID',
    count: `商品数量`,
    price: `价格`,
    discount: `优惠金额`,
    createTime: `生成时间`,
    status: `订单状态`,
    commodityName: `商品名称`,
    commodityImage: `商品图片`
  }
];

async function overview(req, res) {
  var username = req.app.locals.username;
  var all = await ORDER.get(username);

  var data = all.filter((item) => item.username === username);
  var unpaid = 0;
  var paid = 0;
  var canceled = 0;

  data.forEach((order) => {
    switch (order.status) {
      case `未支付`: {
        unpaid++;
        break;
      }

      case `已支付`: {
        paid++;
        break;
      }

      case `已取消`: {
        canceled++;
        break;
      }
    }
  });

  return res.json({
    status: `success`,
    data: {
      unpaid,
      paid,
      canceled
    }
  });
}

async function get(req, res) {
  var username = req.app.locals.username;
  var all = await ORDER.get(username);
  var data = all.filter((item) => item.username === username);
  var type = req.query.type;
  var result = [];

  if (type === `UNPAID`) {
    result = data.filter((item) => item.status === `未支付`);
  }
  if (type === `PAID`) {
    result = data.filter((item) => item.status === `已支付`);
  }
  if (type === `CANCELED`) {
    result = data.filter((item) => item.status === `已取消`);
  }

  if (type === `NOTRATED`) {
    result = data.filter((item) => item.status === `未评价`);
  }

  if (type === `REVIEWED`) {
    result = data.filter((item) => item.status === `已评价`);
  }

  return res.json({
    status: `success`,
    data: result
  });
}

function validateId(req, res, next) {
  if (!req.body.id) {
    return res.json({
      status: `error`,
      error: `缺少订单ID字段`
    });
  } else {
    next();
  }
}

async function payment(req, res, next) {
  var username = req.app.locals.username;
  var ids = req.body.id.split(`,`);

  var data = ids.map((id) => {
    return {
      id,
      status: `已支付`
    };
  });

  // 更新订单
  await ORDER.update(data, username);

  // 找到用户的订单更新商品的销量
  var [userOrder, commodities] = await Promise.all([
    ORDER.get(username),
    COMMODITY.get()
  ]);
  var sales = [];
  var now = Date.now();

  ids.forEach((id) => {
    var order = userOrder.find((order) => order.id === id);
    var commodity = commodities.find((item) => item.id === order.commodityId);

    if (!order || !commodity) {
      console.log(order);
    } else {
      sales.push({
        id: uuid(),
        commodityId: commodity.id,
        sale: order.count,
        ts: now
      });
    }
  });

  await Promise.all([COMMODITY.set(commodities), SALE.add(sales)]);

  next();
}

async function cancel(req, res, next) {
  var username = req.app.locals.username;
  var data = {
    id: req.body.id,
    status: `已取消`,
    username
  };

  await ORDER.update(data, username);

  next();
}

async function del(req, res, next) {
  await ORDER.del(req.body.id, req.app.locals.username);
  next();
}

router.use(oauth);
router.post(`/payment`, validateId, payment, success);
router.post(`/cancel`, validateId, cancel, success);
router.get(`/common/overview`, overview);
router.get(`/common/get`, get);
router.post(`/common/add`, add);
router.post(`/common/del`, validateId, del, success);

module.exports = router;
