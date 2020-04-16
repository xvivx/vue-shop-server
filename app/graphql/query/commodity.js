var {
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLEnumType,
  GraphQLBoolean
} = require('graphql');
var COMMODITY = require('../../ali-oss/commodity');
var PICTURE = require('../../ali-oss/picture');
var SALE = require('../../ali-oss/sale');
var RATE = require('../../ali-oss/rate');
var CommodityType = require('../types/commodity');

var { removeEmptyProps } = require('../../util');

var SortType = new GraphQLEnumType({
  name: `SortType`,
  description: `商品销量或者评分排序类型，支持正序、倒序、不按顺序`,
  values: {
    INCREASE: {
      value: 1,
      description: `按递增排序`
    },
    DECREASE: {
      value: -1,
      description: `按递减排序`
    },
    NORMAL: {
      value: 0,
      description: `不排序`
    }
  }
});


var CommodityListType = new GraphQLObjectType({
  name: `CommodityListType`,
  description: `分页商品列表`,
  fields: {
    data: {
      type: GraphQLList(CommodityType),
      args: {
        start: {
          type: GraphQLInt,
          defaultValue: 1,
          description: `分页起始点`
        },
        size: {
          type: GraphQLInt,
          defaultValue: 10,
          description: `分页大小`
        }
      },
      resolve(data, { start, size }) {
        var startIndex = (start - 1) * size;

        return data.slice(startIndex, startIndex + size);
      }
    },
    total: {
      type: GraphQLInt,
      resolve(data) {
        return data.length;
      }
    }
  }
});

const COMMODITIES_TYPE = new GraphQLObjectType({
  name: `COMMODITIES_TYPE`,
  description: `商品列表`,
  fields: {
    all: {
      type: GraphQLList(CommodityType),
      resolve() {
        return new Error(`禁止获取该字段`);
      }
    },
    detail: {
      type: CommodityType,
      description: `商品详情`,
      args: {
        id: {
          type: GraphQLNonNull(GraphQLString)
        }
      },
      async resolve(all, { id }) {
        var find = all.find((item) => item.id === id);

        if (find) {
          return {
            ...find,
            pictures: await PICTURE.get(id)
          };
        }
      }
    },
    hots: {
      description: `热销商品`,
      type: GraphQLList(CommodityType),
      resolve(all) {
        return all.filter((comm) => comm.hot);
      }
    },
    discounteds: {
      description: `打折商品`,
      type: GraphQLList(CommodityType),
      resolve(all) {
        return all.filter((comm) => comm.discounted);
      }
    },
    list: {
      type: CommodityListType,
      description: `分页加过滤商品`,
      args: {
        hot: {
          type: GraphQLBoolean,
          description: `热销过滤字段`
        },
        classificationId: {
          type: GraphQLString,
          description: `按分类ID过滤的字段`
        },
        categoryId: {
          type: GraphQLString,
          description: `按品牌ID过滤字段`
        },
        saleType: {
          type: SortType
        },
        rateType: {
          type: SortType
        }
      },
      async resolve(
        all,
        { classificationId, categoryId, status, name, hot, saleType, rateType }
      ) {
        var params = {
          classificationId,
          categoryId,
          status,
          name
        };

        if (hot) {
          params.hot = true;
        }

        var data = filter(all, params);

        if (saleType) {
          data = data.sort(
            (prev, next) => saleType * (prev.sales - next.sales)
          );
        }

        if (rateType) {
          data = data.sort(
            (prev, next) => saleType * (prev.rates - next.rates)
          );
        }

        return data;
      }
    }
  }
});

module.exports = {
  type: COMMODITIES_TYPE,
  args: {
    status: {
      type: CommodityType.CommodityStatusType,
      description: `商品状态`,
    }
  },
  async resolve(_, { status }, { app }) {
    var params = { status };

    if (status !== `在线`) {
      if (app.locals.role !== `A`) {
        return new Error(`权限不足`);
      }
    }

    // 这个解析器充当数据库查询操作
    var [all, sales, rates] = await Promise.all([
      COMMODITY.get(params),
      SALE.get(),
      RATE.get()
    ]);

    var slaeTable = flatSale(sales);
    var rateTable = flatRate(rates);

    return all.map((commod) => {
      return {
        ...commod,
        sales: slaeTable[commod.id] || 0,
        rates: rateTable[commod.id],
        inventory: commod.inventory - (slaeTable[commod.id] || 0)
      };
    });
  }
};

function filter(all, params) {
  return all.filter((commod) => {
    for (var key in removeEmptyProps(params)) {
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
