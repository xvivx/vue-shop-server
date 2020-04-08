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
  return function(callback) {
    return function(needPut) {
      function write(data) {
        dbs[dbPath] = data;
        keepSameToDb(data);
      }

      function keepSameToDb(data) {
        clearTimeout(timer);
        timer = setTimeout(async () => {
          var now = await get(dbPath);
          var merge = synchronous(now, data, dbPath, pk);

          dbs[dbPath] = merge;
          dbs[dbPath + 'copy'] = getKeys(merge, pk);

          put(dbPath, merge, `private`);
        }, 1000 * 60);
      }

      var timer = null;

      return async function() {
        var all = dbs[dbPath] || (await get(dbPath));
        var cache = await callback(all, ...arguments, write);

        if (needPut) {
          dbs[dbPath] = cache;
          keepSameToDb(cache);
        } else {
          dbs[dbPath] = all;
        }

        dbs[dbPath + 'copy'] = dbs[dbPath + 'copy'] || getKeys(dbs[dbPath], pk);

        return cache;
      };
    };
  };
}

function getKeys(data, key = `id`) {
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
  }
}

function synchronous(now, cache, dbPath, pk) {
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
