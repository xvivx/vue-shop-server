const router = require('express').Router();
const oauth = require('../middlewares/oauth');
const manage = require('../middlewares/manage');
const { success } = require('../middlewares/status');

// 数据库操作，统一大些
const LOG = require('../ali-oss/log');

async function get(req, res) {
  var logs = await LOG.get();

  return res.json({
    status: `success`,
    data: logs
  });
}

async function clear(req, res) {
  await LOG.clear();
}

router.use(oauth, manage);
router.get(`/all`, get);
router.post(`/clear`, clear, success);

module.exports = router;
