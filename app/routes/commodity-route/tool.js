const COMMODITY = require('../../ali-oss/commodity');
const SALE = require('../../ali-oss/sale');
const RATE = require('../../ali-oss/rate');
const { removeEmptyProps } = require('../../util');

async function getSale(id) {
  var sales = flatSale(await SALE.get());

  return sales[id] || 0;
}

async function getRate(id) {
  var allRates = await RATE.get();
  var currentRate = [];

  allRates.forEach((item) => {
    if (item.rate !== undefined && item.commodityId === id) {
      currentRate.push(item.rate);
    }
  });

  if (currentRate.length) {
    return (
      currentRate.reduce((total, curr) => (total += curr), 0) /
      currentRate.length
    ).toFixed(2);
  } else {
    return undefined;
  }
}

function flatSale(all) {
  var flatTable = {};

  // 计算商品销量
  all.forEach((item) => {
    if (!flatTable[item.commodityId]) {
      flatTable[item.commodityId] = 0;
    }

    flatTable[item.commodityId] += item.sale;
  });

  return flatTable;
}

function flatRate(all) {
  var flatTable = {};

  all.forEach((item) => {
    if (!flatTable[item.commodityId]) {
      flatTable[item.commodityId] = [];
    }

    if (item.rate !== undefined) {
      flatTable[item.commodityId].push(item.rate);
    }
  });

  // 计算商品评分
  for (var key in flatTable) {
    if (flatTable[key].length) {
      flatTable[key] = (
        flatTable[key].reduce((total, curr) => (total += curr), 0) /
        flatTable[key].length
      ).toFixed(2);
    }
  }

  return flatTable;
}

exports.getRate = getRate;
exports.getSale = getSale;
exports.flatSale = flatSale;
exports.flatRate = flatRate;

// 根据条件过滤商品，分页处理
exports.filterCommodities = async function filterCommodities(
  params,
  sortType = {}
) {
  var data = await COMMODITY.get(removeEmptyProps(params));
  var { saleType, rateType } = sortType;

  // 排序放在最后，因为这里比较耗性能
  data = await sortBySale(data, saleType);
  data = await sortByRate(data, rateType);

  return data;
};

// 按销量排序
async function sortBySale(data, type) {
  var sales = flatSale(await SALE.get());
  var commodities = data.map((item) => {
    // 防止意外添加字段到数据库
    item = { ...item };
    item.sale = (sales[item.id] || {}).sale || 0;
    return item;
  });

  if (type === `1` || type === `-1`) {
    return commodities.sort((prev, next) => {
      return (next.sale - prev.sale) * type;
    });
  } else {
    return commodities;
  }
}

// 按评价排序
async function sortByRate(data, type) {
  var rates = flatRate(await RATE.get());
  var commodities = data.map((item) => {
    // 防止意外添加字段到数据库
    item = { ...item };
    item.rate = (rates[item.id] || {}).rate;

    return item;
  });

  if (type === `1` || type === `-1`) {
    commodities = commodities.sort((prev, next) => {
      var prevRate = prev.rate || 0;
      var nextRate = next.rate || 0;
      return (nextRate - prevRate) * type;
    });
  } else {
    return commodities;
  }
}
