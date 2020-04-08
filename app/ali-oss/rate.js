var { ossWrapper } = require('./oss');

var oss = ossWrapper(`data/rates.json`);

async function get(all) {
  return all;
}

async function del(all, id) {
  return all.filter((item) => item.commodityId !== id);
}

async function add(all, data) {
  all.unshift(data);
  return all;
}

exports.add = oss(add)(true);
exports.get = oss(get)(false);
exports.del = oss(del)(true);
