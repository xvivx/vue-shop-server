var { ossWrapper } = require('./oss');

var oss = ossWrapper(`data/all-categories.json`);

// 获取所有的品牌
async function get(all) {
  return all;
}

// 新增品牌
async function add(all, data) {
  if (Array.isArray(data)) {
    all.unshift(...data);
  } else {
    all.unshift(data);
  }

  return all;
}

// 删除品牌
async function del(all, id) {
  return all.filter((item) => item.id !== id);
}

exports.get = oss(get)(false);
exports.add = oss(add)(true);
exports.del = oss(del)(true);
