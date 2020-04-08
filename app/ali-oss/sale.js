var { ossWrapper } = require('./oss');
var oss = ossWrapper(`data/sales.json`);

async function get(all) {
  return all;
}

async function add(all, data) {
  if (Array.isArray(data)) {
    // 批量添加销量
    all = data.concat(all);
  } else {
    all.unshift(data);
  }

  return all;
}


exports.get = oss(get)(false);
exports.add = oss(add)(true);