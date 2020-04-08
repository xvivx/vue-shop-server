var os = require('os');
var app = require('../app');
var loadAllDbs = require('../app/ali-oss/initializer');
var port = 3000;

function ipAddress() {
  var interfaces = os.networkInterfaces();
  var IPAdress = '';

  for (var devName in interfaces) {
    var iface = interfaces[devName];
    for (var i = 0; i < iface.length; i++) {
      var alias = iface[i];
      if (
        alias.family === 'IPv4' &&
        alias.address !== '127.0.0.1' &&
        !alias.internal
      ) {
        IPAdress = alias.address;
        return IPAdress;
      }
    }
  }

  return IPAdress;
}

async function start() {
  try {
    await Promise.all(loadAllDbs());
  } catch (error) {
    console.log(`项目启动时捕获到加载数据库时相关错误:`);
    console.log(error);
  }

  app.listen(port, function() {
    console.log(`http://localhost:${port}`);
    console.log(`http://${ipAddress()}:${port}`);
  });

  return app;
}

module.exports = start();
