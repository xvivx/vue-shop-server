module.exports = async function(req, res, next) {
  if (req.app.locals.role === `A`) {
    next();
  } else {
    return res.json({
      status: `error`,
      error: `权限不足`
    });
  }
};
