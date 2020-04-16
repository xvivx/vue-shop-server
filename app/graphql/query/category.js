var {
  GraphQLNonNull,
  GraphQLString,
  GraphQLList,
  GraphQLObjectType
} = require('graphql');

var CATEGORY = require('../../ali-oss/category');
var CategroryType = require('../types/category');

var CategoryGroupType = new GraphQLObjectType({
  name: `CategoryGroupType`,
  description: `品牌对象，包括品牌列表，品牌详情`,
  fields: {
    detail: {
      type: CategroryType,
      args: {
        id: {
          type: GraphQLNonNull(GraphQLString),
          description: `品牌ID字段`
        }
      },
      resolve(categories, { id }) {
        return categories.find((category) => category.id === id);
      }
    },
    data: {
      type: GraphQLList(CategroryType),
      description: `品牌列表`,
      resolve(all) {
        return all;
      }
    }
  }
});

module.exports = {
  type: CategoryGroupType,
  args: {
    status: {
      type: CategroryType.CategoryStatusType
    }
  },
  async resolve(_, { status }, { app }) {
    if (status !== `在线` && app.locals.role !== `A`) {
      return new Error(`权限不足`);
    }

    var categories = await CATEGORY.get();

    if (status) {
      return categories.filter((category) => category.status === status);
    } else {
      return categories;
    }
  }
};
