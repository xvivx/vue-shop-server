var { ossWrapper } = require('./oss');
var oss = ossWrapper(`data/tokens.json`);

async function get(tokens) {
  return tokens;
}

async function add(tokens, token) {
  tokens[token.id] = {
    username: token.username,
    expired: token.expired,
    role: token.role
  };

  return tokens;
}

async function del(tokens, token) {
  delete tokens[token];
  return tokens;
}

async function update(tokens, token) {
  return Object.assign(tokens, token);
}

exports.add = oss(add)(true);
exports.del = oss(del)(true);
exports.get = oss(get)(false);
exports.update = oss(update)(true);
