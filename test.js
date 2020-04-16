var {
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLInt,
  GraphQLFloat,
  GraphQLEnumType
} = require('graphql');



const ONLINE = `在线`;
const OFFLINE = `下线`;
const ALL = `全部`;

var CommodityStatusType = new GraphQLEnumType({
  name: `CommodityStatusType`,
  description: `商品在线状态`,
  values: {
    ONLINE: {
      value: ONLINE,
      description: `商品在线`
    },
    OFFLINE: {
      value: OFFLINE,
      description: `商品下线，主会场不展示`
    },
    ALL: {
      value: ALL,
      description: `商品全部状态，不区分下线上线`
    }
  }
});

const CommodityType = new GraphQLObjectType({
  name: `COMMODITY`,
  description: `商品类型`,
  fields: {
    price: {
      type: GraphQLFloat,
      description: `商品原价`
    },
    discounted: {
      type: GraphQLFloat,
      description: `商品折扣价格`
    },
    inventory: {
      type: GraphQLInt,
      description: `商品库存`
    },
    status: {
      type: CommodityStatusType
    },
    id: {
      type: GraphQLString,
      description: `商品ID字段，唯一`
    },
    image: {
      type: GraphQLString,
      description: `商品图片`
    },
    name: {
      type: GraphQLString,
      description: `商品名称`
    },
    sales: {
      type: GraphQLInt,
      description: `商品销量`
    },
    rates: {
      type: GraphQLString,
      description: `商品评分`
    },
    pictures: {
      type: GraphQLList(GraphQLString)
    }
  }
});

module.exports = CommodityType;


console.log(CommodityType._fields().status.type._values);
