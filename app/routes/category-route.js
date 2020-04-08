const multer = require('multer');
const router = require('express').Router();
const OSS = require('../ali-oss/oss');
const { PkValue, removeEmptyProps } = require('../util');
const oauth = require('../middlewares/oauth');
const manage = require('../middlewares/manage');
const { success } = require('../middlewares/status');
// 数据库操作，统一大些
const CATEGORY = require('../ali-oss/category');
const { ASSETS_DOMAIN } = require('../const');

const upload = multer().single('file');

async function add(req, res, next) {
  if (!req.file) {
    return res.json({
      status: `error`,
      error: `缺少品牌图片信息`
    });
  }

  var id = PkValue();
  var type = req.file.mimetype.split('/').slice(-1)[0] || 'png';
  var filename = `static/categories/${id}.${type}`;

  var data = {
    id,
    name: req.body.name,
    createTime: Date.now(),
    image: `${ASSETS_DOMAIN}/${filename}`,
    description: req.body.description,
    status: req.body.status
  };

  // 等待写入OSS文件
  await OSS.put(filename, req.file.buffer);
  await CATEGORY.add(data);

  next();
}

async function update(req, res, next) {
  var data = {
    ...req.body,
    updateTime: Date.now()
  };

  if (req.file && req.file.mimetype) {
    var type = req.file.mimetype.split('/').slice(-1)[0] || 'png';
    var filename = `static/categories/${data.id}.${type}`;

    // 写入OSS文件
    await OSS.put(filename, req.file.buffer);
    data.image = `${ASSETS_DOMAIN}/${filename}`;
  }

  await CATEGORY.update(removeEmptyProps(data));

  next();
}

async function del(req, res, next) {
  var id = req.body.id;
  var category = (await CATEGORY.get()).find((item) => item.id === id);

  if (!category) {
    return next();
  }

  await OSS.del(category.image.replace(`${ASSETS_DOMAIN}/`, ''));
  await CATEGORY.del(id);

  next();
}

function validateId(req, res, next) {
  if (!req.body || !req.body.id) {
    return res.json({
      status: `error`,
      error: `缺少品牌ID字段`
    });
  } else {
    next();
  }
}

async function get(req, res) {
  return res.json({
    status: `success`,
    data: await CATEGORY.get()
  });
}

async function query(req, res) {
  var all = await CATEGORY.get();

  return res.json({
    status: `success`,
    data: all.filter((item) => item.status === `在线`)
  });
}

router.get(`/common/query`, query);
router.get(`/get`, get);
router.use(oauth, manage, upload);
router.post(`/add`, add, success);
router.post(`/update`, validateId, update);
router.post(`/del`, validateId, del);
router.use(success);

module.exports = router;
