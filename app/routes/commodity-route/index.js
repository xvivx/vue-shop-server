const multer = require('multer');
const router = require('express').Router();
const { put, deleteMulti } = require('../../ali-oss/oss');
const { PkValue, removeEmptyProps } = require('../../util');
const oauth = require('../../middlewares/oauth');
const validatePagination = require('../../middlewares/pagination');
const manage = require('../../middlewares/manage');
const { success } = require('../../middlewares/status');
const json = require('../../middlewares/json');
const { ASSETS_DOMAIN } = require('../../const');

// 数据库操作，统一大些
const PICTURE = require('../../ali-oss/picture');
const COMMODITY = require('../../ali-oss/commodity');

const upload = multer().array('files', 4);
const { getSale, filterCommodities } = require('./tool');

const commodityPictureId = () => {
  return Math.random()
    .toString(10)
    .slice(2);
};

function validateId(req, res, next) {
  if (!req.body || !req.body.id) {
    return res.json({
      status: `error`,
      error: `缺少商品ID字段`
    });
  } else {
    next();
  }
}

// 添加商品
async function addCommodity(req, res, next) {
  var commodityId = PkValue();
  var pictures = [];
  var promises = [];

  if (!req.files || req.files.length === 0) {
    return res.json({
      status: `error`,
      error: `商品图片不能为空`
    });
  }
  // 拼接图片数据
  req.files.forEach((file, index) => {
    var type = file.mimetype.split('/').slice(-1)[0] || 'png';
    var filename = `static/commodities/${commodityId}-${commodityPictureId()}.${type}`;

    pictures.push(`${ASSETS_DOMAIN}/${filename}`);
    promises.push(put(filename, file.buffer));
  });

  var data = {
    createTime: Date.now(),
    price: Number(req.body.price),
    inventory: Number(req.body.inventory),
    id: commodityId,
    image: pictures[0],
    name: req.body.name,
    discounted: req.body.discounted,
    classificationId: req.body.classificationId,
    categoryId: req.body.categoryId,
    description: req.body.description,
    status: req.body.status
  };

  // 等待写入OSS文件
  await Promise.all(promises);
  await PICTURE.add({
    [commodityId]: pictures
  });

  await COMMODITY.add(removeEmptyProps(data));

  next();
}

// 更新商品
async function updateCommodity(req, res, next) {
  var commodityId = req.body.id;
  var promises = [];
  var pictures = [];

  (req.files || []).forEach((file, index) => {
    if (file.originalname === 'blob') {
      pictures.push(file.buffer.toString());

      return;
    }

    var type = file.mimetype.split('/').slice(-1)[0] || 'png';
    var filename = `static/commodities/${commodityId}-${commodityPictureId()}.${type}`;

    pictures.push(`${ASSETS_DOMAIN}/${filename}`);
    promises.push(put(filename, file.buffer));
  });

  var originPictures = await PICTURE.get(commodityId);
  var needDeletes = originPictures.filter(
    (item) => !pictures.find((pic) => pic === item)
  );

  if (needDeletes.length) {
    // 删除无用图片
    deleteMulti(
      needDeletes.map((item) => item.replace(ASSETS_DOMAIN + '/', ''))
    );
  }
  // 写入图片
  if (pictures.length) {
    // 等待写入OSS文件
    await Promise.all(promises);
    await PICTURE.add({
      [commodityId]: pictures
    });
  }

  var data = {
    price: Number(req.body.price),
    inventory: Number(req.body.inventory),
    upateTime: Date.now(),
    id: commodityId,
    image: pictures[0],
    name: req.body.name,
    discounted: Number(req.body.discounted),
    classificationId: req.body.classificationId,
    categoryId: req.body.categoryId,
    description: req.body.description,
    status: req.body.status
  };

  await COMMODITY.update(removeEmptyProps(data));

  next();
}

// 删除商品
async function delCommodity(req, res, next) {
  var commodityId = req.body.id;

  await COMMODITY.del(commodityId);
  var pictures = await PICTURE.get(commodityId);

  if (pictures.length) {
    await deleteMulti(
      pictures.map((item) => item.replace(ASSETS_DOMAIN + '/', ''))
    );
  }

  next();
}

// 获取图片，编辑商品时回显商品图片用
async function pictures(req, res) {
  var pictures = await PICTURE.get(req.query.id);

  return res.json({
    status: `success`,
    data: pictures
  });
}

// 获取打折商品
async function discounted(req, res) {
  var data = await COMMODITY.get();

  return res.json({
    status: `success`,
    data: data.filter((item) => item.discounted && item.status === `在线`)
  });
}

// 商品详情
async function detail(req, res) {
  if (!req.query.id) {
    return res.json({
      status: `error`,
      error: `缺少商品ID`
    });
  }

  var [commodity] = await COMMODITY.get({ id: req.query.id });

  if (!commodity || (commodity.id && commodity.status !== `在线`)) {
    return res.json({
      status: `error`,
      error: `商品不存在或已经下线`
    });
  }

  var [pictures, sale] = await Promise.all([
    PICTURE.get(commodity.id).catch(() => []),
    getSale(commodity.id).catch(() => 0)
  ]);

  return res.json({
    status: `success`,
    data: {
      ...commodity,
      pictures,
      sale
    }
  });
}

// 查询商品，后台管理用
async function get(req, res) {
  var params = {
    classificationId: req.query.classificationId,
    categoryId: req.query.categoryId,
    name: req.query.name,
    status: req.query.status
  };

  if (req.query.hot === `true`) {
    params.hot = true;
  } else if (req.query.hot === `false`) {
    params.hot = false;
  }

  var start = req.query.pageStart * 1;
  var size = req.query.pageSize * 1;
  var data = await filterCommodities(params, {
    saleType: req.query.saleType,
    rateType: req.query.rateType
  });

  return res.json({
    status: `success`,
    data: data.slice(start * size, (start + 1) * size),
    total: data.length
  });
}

// 前台查询商品用
async function query(req, res) {
  var params = {
    classificationId: req.query.classificationId,
    categoryId: req.query.categoryId,
    name: req.query.name,
    status: `在线`
  };

  var start = req.query.pageStart * 1;
  var size = req.query.pageSize * 1;
  var data = await filterCommodities(params, {
    saleType: req.query.saleType,
    rateType: req.query.rateType
  });

  var commodities = data.slice(start * size, (start + 1) * size);

  // 过滤掉不需要的字段，减少流量
  commodities = commodities.map((item) => {
    item.inventory = item.inventory - item.sale;

    delete item.createTime;
    delete item.upateTime;
    delete item.status;

    return item;
  });

  return res.json({
    status: `success`,
    data: commodities,
    total: data.length
  });
}

router.get(`/common/query`, validatePagination, query);
router.get(`/common/detail`, detail);
router.get(`/common/discounted`, discounted);
router.get(`/pictures`, pictures);

router.get(`/get`, validatePagination, get);
router.use(oauth, manage);
router.post(`/add`, upload, addCommodity);
router.post(`/update`, upload, validateId, updateCommodity);
router.post(`/del`, json, validateId, delCommodity);
router.use(success);

module.exports = router;
