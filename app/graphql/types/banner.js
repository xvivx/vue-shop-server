var { GraphQLObjectType, GraphQLString, GraphQLEnumType } = require('graphql');

const ON = `on`;
const OFF = `off`;

var BannerStatusType = new GraphQLEnumType({
  name: `BannerStatusType`,
  description: `banner显示状态`,
  values: {
    ON: {
      value: ON,
      description: `显示banner`
    },
    OFF: {
      value: OFF,
      description: `不显示`
    }
  }
});

const BannerType = new GraphQLObjectType({
  name: `BANNER`,
  fields: {
    title: {
      type: GraphQLString,
      description: `banner标题`
    },
    link: {
      type: GraphQLString,
      description: `按钮跳转地址`
    },
    id: {
      type: GraphQLString,
      description: `banner唯一ID`
    },
    btntext: {
      type: GraphQLString,
      description: `banner按钮文字`
    },
    image: {
      type: GraphQLString,
      description: `banner图片地址`
    },
    bgcolor: {
      type: GraphQLString,
      description: `banner背景色`
    },
    status: {
      type: BannerStatusType,
      description: `banner显示状态`
    }
  }
});

BannerType.BannerStatusType = BannerStatusType;
module.exports = BannerType;
