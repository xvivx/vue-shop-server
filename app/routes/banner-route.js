const multer = require('multer');
const router = require('express').Router();
const { success } = require('../middlewares/status');
const json = require('../middlewares/json');
const oauth = require('../middlewares/oauth');
const manage = require('../middlewares/manage');
const { PkValue } = require('../util');
const OSS = require('../ali-oss/oss');
const BANNER = require('../ali-oss/banner');
const { ASSETS_DOMAIN } = require('../const');

const upload = multer().single('file');

async function get(req, res) {
  var status = req.query.status || ``;
  var all = await BANNER.get();
  var data;

  if (!status) {
    data = all;
  } else {
    data = all.filter((item) => item.status === status);
  }

  data = data.sort((prev, next) => {
    return (prev.index || 0) - (next.index || 0);
  });

  return res.json({
    status: `success`,
    data
  });
}

async function add(req, res, next) {
  if (!req.file) {
    return res.json({
      status: `error`,
      error: `缺少banner图片信息`
    });
  }

  var data = {
    ...req.body,
    id: PkValue(1)
  };

  var type = req.file.mimetype.split('/').slice(-1)[0] || 'png';
  var filename = `static/banners/${data.id}.${type}`;

  data.image = `${ASSETS_DOMAIN}/${filename}`;
  // 等待写入OSS文件
  await OSS.put(filename, req.file.buffer);
  await BANNER.add(data);

  next();
}

async function update(req, res, next) {
  if (!req.body.id) {
    return res.json({
      status: `error`,
      error: `缺少ID字段`
    });
  }

  var data = {
    ...req.body
  };

  if (req.file && req.file.mimetype) {
    var type = req.file.mimetype.split('/').slice(-1)[0] || 'png';
    var filename = `static/banners/${data.id}.${type}`;

    // 写入OSS文件
    await OSS.put(filename, req.file.buffer);
    data.image = `${ASSETS_DOMAIN}/${filename}`;
  }

  await BANNER.update(data);

  next();
}

async function del(req, res, next) {
  var id = req.body.id;

  if (!id) {
    return res.json({
      status: `error`,
      error: `缺少ID字段`
    });
  }

  var banner = (await BANNER.get()).find((item) => item.id === id);

  await OSS.del(banner.image.replace(`${ASSETS_DOMAIN}/`, ''));
  await BANNER.del(banner.id);

  next();
}

router.get(`/get`, get);
router.use(oauth, manage);
router.post(`/add`, upload, add, success);
router.post(`/update`, upload, update, success);
router.post(`/del`, json, del, success);

module.exports = router;
