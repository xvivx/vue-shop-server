const { ossWrapper } = require('./oss');
const oss = ossWrapper(`data/all-classifications.json`);

async function get(all) {
  return all;
}

async function add(all, data) {
  all.unshift(data);
  return all;
}

async function del(all, id) {
  return all.filter((item) => item.id !== id);
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

exports.add = oss(add)(true);
exports.del = oss(del)(true);
exports.get = oss(get)(false);
exports.update = oss(update)(true);
