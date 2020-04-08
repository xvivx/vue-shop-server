var { ossWrapper } = require('./oss');

var oss = ossWrapper(`data/logs.json`);

function get(all) {
  return all;
}


async function add(all, data) {
  all.unshift(data);

  return all;
}

async function clear() {
  return [];
}


exports.get = oss(get)(false);
exports.add = oss(add)(true);
exports.clear = oss(clear)(true);