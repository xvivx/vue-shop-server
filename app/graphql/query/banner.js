var {
  GraphQLNonNull,
  GraphQLString,
  GraphQLList,
  GraphQLObjectType
} = require('graphql');

var BANNER = require('../../ali-oss/banner');
var BannerType = require('../types/banner');

var BannerGroupType = new GraphQLObjectType({
  name: `BannerGroupType`,
  description: `轮播对象`,
  fields: {
    detail: {
      type: BannerType,
      args: {
        id: {
          type: GraphQLNonNull(GraphQLString),
          description: `轮播图的ID字段`
        }
      },
      resolve(banners, { id }) {
        return banners.find((banner) => banner.id === id);
      }
    },
    data: {
      type: GraphQLList(BannerType),
      description: `轮播组`,
      resolve(banners) {
        return banners;
      }
    }
  }
});

module.exports = {
  type: BannerGroupType,
  args: {
    status: {
      type: BannerType.BannerStatusType
    }
  },
  async resolve(_, { status }, { app }) {
    if (status !== `on` && app.locals.role !== `A`) {
      return new Error(`权限不足`);
    }

    var banners = await BANNER.get();

    if (status) {
      return banners.filter((banner) => banner.status === status);
    } else {
      return banners;
    }
  }
};
