var LOG = require('./ali-oss/log');

function uuid() {
  var d = new Date().getTime();

  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(
    c
  ) {
    var r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c == 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
  return uuid;
}

function PkValue(len = 2) {
  var arr = [];

  while (len) {
    len--;
    arr.push(
      Math.random()
        .toString(36)
        .slice(2)
    );
  }
  return arr.join(`-`);
}

function removeEmptyProps(obj) {
  var result = Object.create(null);

  if (!obj) {
    return { a: 1 };
  }

  for (var key in obj) {
    if (obj[key] === undefined) {
      continue;
    }

    if (typeof obj[key] === `string` && obj[key] === '') {
      continue;
    }

    if (Number.isNaN(obj[key])) {
      continue;
    }

    result[key] = obj[key];
  }

  return result;
}

// 捕获未处理的异步异常
function unhandledRejection(reason) {
  var now = new Date();
  var date = now.toISOString().slice(0, 10);
  var time = now.toTimeString().slice(0, 8);
  var error = reason;
  var message = ``;
  var stack = null;
  // 这是程序内抛出的统一错误, 带有status字段
  if (reason.status === `error`) {
    error = reason.error || {};
  }

  if (reason.extraInfo) {
    // 优先使用这个信息
    message = reason.extraInfo;
  } else if (typeof error === `string`) {
    // 简单类型的错误，说明程序内抛出一个文本错误，仅包含信息，不包含堆栈
    message = error;
  } else {
    message = error.message || `未知错误`;
  }

  var record = {
    time: `${date} ${time}`,
    message,
    stack: error.stack || null
  };

  if (process.env.NODE_ENV !== `production`) {
    console.error(record);
  } else {
    // 错误埋点，方便排查问题，类似于日志功能
    record.id = uuid();
    LOG.add(record);
  }
}

exports.unhandledRejection = unhandledRejection;
exports.uuid = uuid;
exports.PkValue = PkValue;
exports.removeEmptyProps = removeEmptyProps;
