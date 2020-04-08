const { Server } = require('@webserverless/fc-express');
const app = require('./index');
const server = new Server(app);
const loadAllDbs = require('./ali-oss/initializer');

// http trigger entry
exports.handler = function(req, res, context) {
  server.httpProxy(req, res, context);
};

exports.initializer = async function(context, callback) {
  try {
    var dbs = loadAllDbs();
    await Promise.all(dbs);
  } catch (err) {
    console.error(`连接某个数据库失败`);
  }

  callback(null, '');
};
