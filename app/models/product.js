// app/models/product.js

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ProductSchema = new Schema({
	title: String,
	author: String,
	isbn: Number,
	dewey: Number,
	firstEdition: Boolean,
	pageCount: Number,
	description: String,
	condition: String,
	coverPriceFloat: Number,
	price: Number,
	forSale: Boolean, 
	row: String,
	stack: String,
	box: String,
	notes: String,
	productCreatedDate: String,
	productUpdatedDate: String

});

module.exports = mongoose.model('Product', ProductSchema);