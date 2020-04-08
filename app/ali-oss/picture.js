var { ossWrapper } = require('./oss');

var oss = ossWrapper(`data/all-pictures.json`);

async function add(all, data) {
  return Object.assign(all, data);
}

async function del(all, id) {
  delete all[id];
  return all;
}

async function get(all, id) {
  return all[id];
}

exports.add = oss(add)(true);
exports.del = oss(del)(true);
exports.get = oss(get)(false);
