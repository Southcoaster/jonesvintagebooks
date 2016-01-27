// server.js

//BASE SETUP//
var express  = require('express'); 
var bodyParser = require('body-parser');
var stylus = require('stylus');
var nib = require('nib')
var app = express();
var xml2js = require('xml2js');
var fs = require('fs');
var http = require('http');


app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(stylus.middleware({	
	src: __dirname + '/public/stylus',
	dest: __dirname + '/public/stylesheets',
	compile: function(str, path){	
			return stylus(str)
				.set('filename', path)
				.use(nib());
			console.log('finished compiling stylus')
		}
}));

app.use(express.static(__dirname + '/public'));

var mongoose   = require('mongoose');
mongoose.connect('mongodb://localhost/test');
//mongoose.connect('mongodb://o1iverjones:2manybooks@ds035653.mongolab.com:35653/jonesvintagebooksdb'); // connect to our database
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function(){
	console.log('--- Mongodb connected ---')
});

//Bring in Product model
var Product = require('./app/models/product');

//configure app to use bodyParser(), this will let us get the data from a POST 
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;



////examples of parsing xml from a string
//var parseString = require('xml2js').parseString;
// var xml = "<root>Hello xml2js!</root>"
// parseString(xml, function (err, result) {
//     console.dir(result);
// });

// //from a file... 
// var parser = new xml2js.Parser();

// fs.readFile(__dirname + '/test-export.xml', function(err, data) {
//     parser.parseString(data, function (err, result) {
// 		var isbnCollection = [];
//     	function iterate(obj) {
// 		    for (var property in obj) {
// 		        if (obj.hasOwnProperty(property)) {
// 		            if (property == "isbn")
// 		                isbnCollection.push(obj[property])
// 		            else
// 		            	iterate(obj[property]);
// 		                //console.log(property + "   " + obj[property]);
// 		        }
// 		    }
// 		}
		
// 		iterate(result);

//         //console.dir(result);
//         return isbnCollection;
//         console.log('Done');
//     });
// });



//ROUTING//
var router = express.Router();

var getCover = function(isbn){
	var coverUrl = 'covers.openlibrary.org/b/isbn/';
	var coverUrlEnding = '.jpg';
	coverUrl += isbn;
	coverUrl += coverUrlEnding;
	return coverUrl
}

//middleware to use for all requests to the api
router.use(function(req, res, next){
	//do logging
	console.log('Something is happening');
	next();
})

router.get('/', function(req, res){
	//res.json({message: 'hooray! welcome to our api!!!!'});
	res.render('index', {title: 'Home Page'})
});


//Display all Product(s) Routes
router.route('/products')

	//get all products
	.get(function(req, res){
		Product
		.find({})
		.limit(10)
		.sort({_id : -1})
		.exec(function(err, products){
			products.pageTitle = "Here are all our products: ";
			res.render('products', {"products" : products});
		});
	});


//Create New Product by POST / GET displays all products from newest creation date.
router.route('/products/new')
	.post(function(req, res){

		var product = new Product();
		product.title = req.body.title;
		product.author = req.body.author;
		product.description = req.body.description;
		product.isbn = req.body.isbn;
		product.firstEdition = req.body.firstEdition;
		product.dewey = req.body.dewey;
		product.pageCount = req.body.pageCount;
		product.condition = req.body.condition;
		product.price = req.body.price;
		product.row = req.body.row;
		product.stack = req.body.stack;
		product.box = req.body.box;
		product.createdDate = new Date();
		product.updatedDate = new Date();
		if(req.body.notes)
			product.notes = req.body.notes;

		//save product and error checking
		product.save(function(err){
			if(err)
				res.send(err);

			console.log("saving product: "+product._id)			
		})

		// Query to the product database for most products sorted by most recently created
		Product
			.find()
			.sort({"_id":-1})
			.exec(function(err, products){
				products.pageTitle = "You added a new product: "
				res.render('products', {"products" : products});
			});
	})	
	.get(function(req, res){
		Product.find(function(err, products){
			if (err)
				res.send(err);

			//res.json(products);
			res.render('product-form', {})
		});
	});

router.route('/products/new/isbn')

	.get(function(req, res){
		res.render('isbn-form', {})
	})
	.post(function(req, res){
		var isbn = req.body.isbn;
		var options = {
			  host: 'isbndb.com',
			  path: '/api/v2/json/RBG4RU6D/book/' + isbn
			};

		var callback = function(response) {
		  //console.log(response)

		  var str = '';

		  //another chunk of data has been recieved, so append it to `str`
		  response.on('data', function (chunk) {
		    str += chunk;
		  });

		  //the whole response has been recieved, so we just print it out here
		  response.on('end', function () {
		  	var products = JSON.parse(str);
		  	if(products.error){
		  		var errorText = "Unable to locate ISBN " + isbn;
		  		res.render('isbn-form', {error: errorText})
		  	} else {
		  		products.pageTitle = "ISBN Search Result"
			  	products.isbn = isbn;
			  	products.coverImage = getCover(isbn);
			  	res.render('isbn-results', {"products" : products})
		  	}
		  	
		  });
		};

		http.request(options, callback).end();
	});


//Display, Update and Delete single product
router.route('/products/:product_id')

	//get the product with that id
	.get(function(req, res){
		Product.findById(req.params.product_id, function(err, product){
			if(err)
				res.send(err);
			res.render('product-detail', {'product': product});
		});
	})

	.put(function(req, res){

		// use our product model to find the product we want
		Product.findById(req.params.product_id, function(err, product){

			if (err)
				res.send(err);

		 	product.name = req.body.name;  // update product name

			product.save(function(err){
				if(err)
					res.send(err);

				res.json({message: 'Product updated.'});
			});
		});
	})

	.delete(function(req, res){
		Product.remove({
			_id: req.params.product_id
		}, function(err, product){
			if (err)
				res.send(err);

			res.json({message: "Product "+req.params.product_id+" has been deleted"});
		});
	});

//Register our routes 

//all our routes will be prefixed with /api
app.use('/', router);

// FIRE IT UP!
app.listen(port);
console.log("hit up "+port+" for the fun.");
