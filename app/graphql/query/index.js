var {
  GraphQLObjectType,
} = require('graphql');

var Banner = require('./banner');
var Commodity = require('./commodity');
var Category = require('./category');


const QueryType = new GraphQLObjectType({
  name: `Query`,
  description: `入口查询`,
  fields: {
    banner: Banner,
    commodity: Commodity,
    category: Category
  }
});

module.exports = QueryType;
