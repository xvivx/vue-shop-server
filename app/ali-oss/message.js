var { ossWrapper } = require('./oss');

var oss = ossWrapper(`data/messages.json`);

var messages = [
  {
    id: `123`,
    to: `god`,
    content: `你好`,
    time: `2019-01-19`,
    from: `anyoums`
  }
];

async function get(all) {
  return all;
}

async function add(all, data) {
  all.push(data);
  return all;
}

async function del(all, id) {
  return all.filter((item) => item.id !== id);
}

exports.add = oss(add)(true);
exports.get = oss(get)(false);
exports.del = oss(del)(true);
