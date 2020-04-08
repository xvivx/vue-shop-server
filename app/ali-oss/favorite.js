var { ossWrapper } = require('./oss');

var oss = ossWrapper(`data/favorites.json`);

async function get(all, username) {
  if (!username) {
    return [];
  }

  return all[username];
}

async function add(all, data, username) {
  if (!all[username]) {
    all[username] = [];
  }

  all[username].push(data);

  return all;
}

async function del(all, id, username) {
  if (!all[username]) {
    all[username] = [];
  }

  all[username] = all[username].filter((item) => item.id !== id);

  return all;
}

exports.get = oss(get)(false);
exports.add = oss(add)(true);
exports.del = oss(del)(true);
