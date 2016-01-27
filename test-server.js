//test-server.js

var http = require('http');
var express  = require('express'); 
var port = process.env.PORT || 8080;
var app = express();

var router = express.Router();

//middleware to use for all requests to the api
router.use(function(req, res, next){
	//do logging
	console.log('Something is happening');
	next();
})

router.get('/', function(req, res){
	//res.json({message: 'hooray! welcome to our api!!!!'});
	res.json({title: 'Home page'})
});

app.use('/', router);

app.listen(port);
console.log("hit up "+port+" for the fun.");