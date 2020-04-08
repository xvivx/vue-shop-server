var { ossWrapper } = require('./oss');

var oss = ossWrapper(`data/orders.json`);

async function add(all, data) {
  if (Array.isArray(data)) {
    return data.concat(all);
  } else {
    all.unshift(data);
    return all;
  }
}

async function update(all, data, username) {

  all = all.map((item) => {
    if (item.username !== username) {
      return item;
    }

    if (!Array.isArray(data)) {
      if (item.id === data.id) {
        item.status = data.status;
      }
    } else {
      var curr = data.find((data) => data.id === item.id);

      if (curr) {
        item.status = curr.status;
      }
    }

    return item;
  });

  return all;
}

async function get(all, username) {
  return all.filter((item) => item.username === username);
}

async function del(all, id, username) {
  all = all.filter((item) => {
    if (item.id === id && item.username === username) {
      return false;
    } else {
      return true;
    }
  });

  return all;
}

exports.add = oss(add)(true);
exports.update = oss(update)(true);
exports.del = oss(del)(true);
exports.get = oss(get)(false);
