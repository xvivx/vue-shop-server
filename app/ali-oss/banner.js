var { ossWrapper } = require('./oss');

var oss = ossWrapper(`data/banners.json`);

async function get(all) {
  return all;
}

async function add(all, data) {
  all.push(data);

  return all;
}

async function update(all, data) {
  all = all.map((item) => {
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

async function del(all, id) {
  all = all.filter((item) => item.id !== id);

  return all;
}

exports.get = oss(get)(false);
exports.add = oss(add)(true);
exports.del = oss(del)(true);
exports.update = oss(update)(true);
