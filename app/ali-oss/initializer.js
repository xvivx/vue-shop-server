var user = require('./user');
var address = require('./address');
var cart = require('./cart');
var commodity = require('./commodity');
var picture = require('./picture');
var favorite = require('./favorite');
var token = require('./token');
// var hot = require('./hot');
var message = require('./message');
var order = require('./order');
var category = require('./category');
var classification = require('./classification');
var sale = require('./sale');
var rate = require('./rate');


module.exports =  function () {
  return [
    token.get(),
    user.get(),
    address.get(),
    cart.get(),
    commodity.get(),
    picture.get(),
    favorite.get(),
    message.get(),
    order.get(),
    category.get(),
    classification.get(),
    sale.get(),
    rate.get(),
  ];
}