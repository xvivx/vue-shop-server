var { ossWrapper } = require('./oss');

var oss = ossWrapper(`data/carts.json`);

async function get(all, username) {
  return all[username] || [];
}

async function add(all, data, username) {
  var isExist = false;
  var carts = all[username] || [];

  carts = carts.map((item) => {
    if (data.id === item.id) {
      isExist = true;
      item.count = data.count;
    }

    return item;
  });

  if (!isExist) {
    carts.push({
      id: data.id,
      count: data.count
    });
  }

  all[username] = carts;

  return all;
}

async function del(all, id, username) {
  var carts = all[username] || [];

  carts = carts.filter((item) => item.id !== id);

  all[username] = carts;

  return all;
}

async function clear(all, username) {
  all[username] = [];
  return all;
}

async function delMult(all, ids, username) {
  var carts = all[username] || [];

  carts = carts.filter((item) => !ids.find((id) => item.id === id));

  all[username] = carts;

  return all;
}

exports.get = oss(get)(false);
exports.add = oss(add)(true);
exports.del = oss(del)(true);
exports.clear = oss(clear)(true);
exports.delMult = oss(delMult)(true);
