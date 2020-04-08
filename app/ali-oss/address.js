var { ossWrapper } = require('./oss');
var oss = ossWrapper(`data/address.json`);


async function get(all, username) {
  if (!username) {
    return [];
  }

  return all.filter((item) => item && item.username === username);
}

async function add(all, data) {
  all.unshift(data);

  return all;
}

async function del(all, data) {
  return all.filter(item => item.id !== data.id || data.username !== item.username);
}

async function update(all, data) {
  all = all.map((item) => {
    if (item.username !== data.username) {
      return item;
    }

    if (item.id === data.id) {
      item = {
        ...item,
        ...data
      };
    }

    return item;
  });

  return all;
}

exports.add = oss(add)(true);
exports.del = oss(del)(true);
exports.get = oss(get)(false);
exports.update = oss(update)(true);
