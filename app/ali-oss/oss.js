const OSS = require('ali-oss');
const dbs = require('./dbs');
const { ossOptions } = require('../../credentials');
const ossClient = new OSS(ossOptions);

async function withRetry(func, times = 3) {
  while (times) {
    try {
      return await func();
    } catch (error) {
      var errInfo = (error.message || ``).match(/https?:\/\/function\S+/) || [];
      var fileName = errInfo[0] || `未知文件`;
      var isTimeout = ~[
        `ConnectionTimeoutError`,
        `ResponseTimeoutError`
      ].indexOf(error.code);

      times--;

      // 重试次数够了或者不是超时原因直接返回
      if (times <= 0 || !isTimeout) {
        return Promise.reject({
          status: `error`,
          error: error,
          extraInfo: `${fileName}获取超时`
        });
      }
    }
  }
}

async function get(objName) {
  var result = await withRetry(() => ossClient.get(objName));
  var content;

  try {
    content = JSON.parse(result.content.toString('utf-8'));
  } catch (error) {
    content = result.content.toString('utf-8');
  }

  return content;
}

async function put(objName, data, acl = 'public-read') {
  var buffer;

  if (Buffer.isBuffer(data)) {
    buffer = data;
  } else if (typeof data === 'object') {
    buffer = Buffer.from(JSON.stringify(data, null, 2));
  } else {
    buffer = Buffer.from(String(data));
  }

  var ossResult = await withRetry(() =>
    ossClient.put(objName, buffer, {
      headers: {
        'x-oss-object-acl': acl
      }
    })
  );

  var resp = (ossResult && ossResult.res) || {};

  if (resp.status === 200 || resp.status === 204) {
    return {
      status: `success`,
      name: ossResult.name
    };
  } else {
    return Promise.reject({
      status: `error`,
      error: `调用OSS网络出错，状态码：${resp.status || `未知错误`}`
    });
  }
}

async function upload(objName, stream) {
  var ossResult = await withRetry(() =>
    ossClient.putStream(objName, stream, {
      headers: {
        'x-oss-object-acl': `public-read`
      }
    })
  );

  var resp = (ossResult && ossResult.res) || {};

  if (resp.status === 200 || resp.status === 204) {
    return {
      status: `success`,
      name: ossResult.name
    };
  } else {
    return Promise.reject({
      status: `error`,
      error: `调用OSS网络出错，状态码：${resp.status || `未知错误`}`
    });
  }
}

async function del(objName) {
  var ossResult = await withRetry(() => ossClient.delete(objName));
  var resp = (ossResult && ossResult.res) || {};

  if (resp.status === 200 || resp.status === 204) {
    return {
      status: `success`,
      name: ossResult.name
    };
  } else {
    return Promise.reject({
      status: `error`,
      error: `调用OSS网络出错，状态码：${resp.status || `未知错误`}`
    });
  }
}

async function deleteMulti(objNames) {
  await withRetry(() =>
    ossClient.deleteMulti(objNames, {
      quiet: true
    })
  );

  return {
    status: `success`
  };
}

function ossWrapper(dbPath, pk = `id`) {
  var timer = null;

  // 可能有些情况需要自定义写入，目前还没发现，先留下口子
  function write(data) {
    dbs[dbPath] = data;
    keepSameToDb(data);
  }

  // 提升这块逻辑，一个db只维护一个定时器延迟写入
  function keepSameToDb(data) {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      var now = await get(dbPath);

      if (!now || !data) {
        // 走到这里时是数据没有读取成功，导致now或者本地内存中数据异常，禁止写入，等待下一次写入
        // 以前用公网调取，失败率较高，现使用内网调用oss
        return;
      }

      var merge = synchronous(now, data, dbPath, pk);

      // 同步数据库和本地数据的结果，写了这么多
      // 真想买个数据库服务，就不用这么麻烦了，学习情况还是保持0成本吧
      dbs[dbPath] = merge;
      dbs[dbPath + 'copy'] = getKeys(merge, pk);

      put(dbPath, merge, `private`);
    }, 1000 * 60);
  }

  return function(callback) {
    return function(autoWrite, customWrite) {
      return async function() {
        // 首次启动是没有缓存，需要从数据库取，之后只维护缓存中数据
        // 只有要写入数据库时才会再取数据进行merge
        if (!dbs[dbPath]) {
          // 将数据缓存至内存中，同时缓存数据表的主键
          dbs[dbPath] = await get(dbPath);
          // 缓存此时的key
          dbs[dbPath + 'copy'] =
            dbs[dbPath + 'copy'] || getKeys(dbs[dbPath], pk);
        }

        var args = [...arguments];

        if (autoWrite === false && customWrite === true) {
          // 只有自动写入是true时才会把write函数传给callback
          args.push(write);
        }

        // 需要写入数据库的要返回出来
        var cache = await callback(dbs[dbPath], ...args);

        if (autoWrite) {
          // 增删查改后延迟批量写入
          dbs[dbPath] = cache;
          keepSameToDb(dbs[dbPath]);
        }

        // 将callback的返回结果抛出去
        return cache;
      };
    };
  };
}

function getKeys(data, key = `id`) {
  if (!data) {
    return [];
  }

  if (Array.isArray(data)) {
    return data.map((item) => item[key]);
  } else {
    return Object.keys(data);
  }
}

function delKey(data, key, pk) {
  if (Array.isArray(data)) {
    return data.filter((item) => item[pk] !== key);
  } else {
    delete data[key];
    return data;
  }
}

function synchronous(now, cache, dbPath, pk) {
  if (!cache || !now) {
    return;
  }

  var cacheKeys = `,` + getKeys(cache, pk).join(`,`) + `,`;
  var nowKeys = `,` + getKeys(now, pk).join(`,`) + `,`;

  // 把数据库里需要删除的数据删掉，这里要进行merge操作
  dbs[dbPath + 'copy'].forEach((key) => {
    // 如果当前本地数据中没有该key就把现在数据库里的key删掉
    if (cacheKeys.indexOf(`,${key},`) === -1) {
      now = delKey(now, key, pk);
    }

    // 如果当前数据库里没有该key，就把本地数据中的key删掉
    if (nowKeys.indexOf(`,${key},`) === -1) {
      cache = delKey(cache, key, pk);
    }
  });

  if (Array.isArray(now)) {
    var map = new Map();

    now.concat(cache).forEach((item) => {
      map.set(item[pk], item);
    });

    var arr = [...map.values()];

    return arr;
  } else {
    return Object.assign({}, now, cache);
  }
}

exports.del = del;
exports.put = put;
exports.get = get;
exports.deleteMulti = deleteMulti;
exports.upload = upload;

exports.client = ossClient;
exports.ossWrapper = ossWrapper;
