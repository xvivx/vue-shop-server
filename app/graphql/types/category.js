var { GraphQLObjectType, GraphQLString, GraphQLEnumType } = require('graphql');

const ON = `在线`;
const OFF = `下线`;

var CategoryStatusType = new GraphQLEnumType({
  name: `CategoryStatusType`,
  description: `品牌显示状态`,
  values: {
    ON: {
      value: ON,
      description: `显示品牌`
    },
    OFF: {
      value: OFF,
      description: `不显示品牌`
    }
  }
});

const CategoryType = new GraphQLObjectType({
  name: `CATEGORY`,
  fields: {
    id: {
      type: GraphQLString,
      description: `品牌唯一ID`
    },
    name: {
      type: GraphQLString,
      description: `品牌名称`
    },
    image: {
      type: GraphQLString,
      description: `品牌图片`
    },
    description: {
      type: GraphQLString,
      description: `品牌描述`
    },
    status: {
      type: CategoryStatusType,
      description: `品牌显示状态`
    }
  }
});

CategoryType.CategoryStatusType = CategoryStatusType;
module.exports = CategoryType;
