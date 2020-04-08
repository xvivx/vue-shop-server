var { ossWrapper } = require('./oss');
var oss = ossWrapper(`data/users.json`, `username`);

async function get(all, username) {
  return all.find((item) => item.username === username);
}

async function add(all, data) {
  all.unshift(data);

  return all;
}

async function update(all, data) {
  all = all.map((item) => {
    if (item.username === data.username) {
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
exports.get = oss(get)(false);
exports.update = oss(update)(true);
