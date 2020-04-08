const router = require('express').Router();
const { success } = require('../middlewares/status');
const oauth = require('../middlewares/oauth');
const manage = require('../middlewares/manage');
const { PkValue, removeEmptyProps } = require('../util');
var CLASSIFICATION = require('../ali-oss/classification');

async function get(req, res) {
  return res.json({
    status: `success`,
    data: await CLASSIFICATION.get()
  });
}

async function add(req, res, next) {
  var id = PkValue();

  var data = {
    id,
    name: req.body.name,
    createTime: Date.now(),
    info: req.body.info
  };

  await CLASSIFICATION.add(data);

  next();
}

async function update(req, res, next) {
  var data = {
    id: req.body.id,
    name: req.body.name,
    updateTime: Date.now(),
    info: req.body.info
  };

  await CLASSIFICATION.update(removeEmptyProps(data));

  next();
}

async function del(req, res, next) {
  await CLASSIFICATION.del(req.body.id);

  next();
}

router.get(`/query`, get);
router.use(oauth, manage);
router.post(`/add`, add);
router.post(`/update`, update);
router.post(`/delete`, del);
router.use(success);


module.exports = router;
