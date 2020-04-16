var QueryType = require('./query');
var {GraphQLSchema} = require('graphql');

module.exports = new GraphQLSchema({
  query: QueryType
});
