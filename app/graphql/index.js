var graphqlHTTP = require('express-graphql');
var schema = require('./schema')


module.exports = graphqlHTTP({
  schema: schema,
  graphiql: process.env.NODE_ENV !== `production`,
});
