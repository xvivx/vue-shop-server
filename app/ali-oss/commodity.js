var { ossWrapper } = require('./oss');
var { removeEmptyProps } = require('../util');

var oss = ossWrapper(`data/all-commodities.json`);

async function get(all, data) {
  if (!data) {
    return all;
  }

  // 由于oss会把write函数传过来，这里区分一下
  if (typeof data === `function`) {
    return all;
  }

  var params = removeEmptyProps(data);
  
  if (Object.keys(params).length === 0) {
    return all;
  }

  return all.filter((commod) => {
    for (var key in params) {
      if (key === `name`) {
        if (!~commod.name.indexOf(params.name)) {
          return false;
        }
      } else {
        if (params[key] !== commod[key]) {
          return false;
        }
      }
    }

    return true;
  });
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

async function set(all, data) {
  return data;
}

exports.set = oss(set)(true);
exports.get = oss(get)(false);
exports.add = oss(add)(true);
exports.del = oss(del)(true);
exports.update = oss(update)(true);
