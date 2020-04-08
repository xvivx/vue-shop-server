// 分页验证中间件
module.exports = function validatePagination(req, res, next) {
  if (!req.query) {
    // 非法请求
    return res.sendStatus(400);
  }

  var start = req.query.pageStart * 1;
  var size = req.query.pageSize * 1;

  if (size > 30) {
    return res.json({
      status: `error`,
      error: `一下子拉辣么多，你想累死我吗？`
    });
  }

  if (!Number.isInteger(start) || !Number.isInteger(size) || start < 0 || size < 0) {
    return res.json({
      status: `error`,
      error: `分页数据信息不合法`
    });
  }

  next();
}