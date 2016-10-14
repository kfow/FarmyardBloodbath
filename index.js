var express = require('express');

var app = express();

app.disable('x-powered-by');

var handlebars = require('express-handlebars').create({defaultLayout:'main'});

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

// More imports here
app.set('port', process.env.PORT || 3000);

// set static to /public
app.use(express.static(__dirname + '/public'));

// -----------------------------------------------------------------------------
// base directory
app.get('/', function(req, res){
  res.render('home');
});

app.use(function(req, res, next){
  console.log("Looking for URL " + req.url);
  next();
});

//app.use(function(err, req, res, next){
//  console.log('Error: ' + err.message);
//  next();
//})

app.get('/about', function(req, res){
  res.render('about');
});

app.get('/contact', function(req, res){
  res.render('contact');
});

app.use(function(req, res){
  res.type('text/html');
  res.status('404');
  res.render('404');
})


// -----------------------------------------------------------------------------
app.listen(app.get('port'), function(){
    console.log('Express started press Ctrl-C to terminate')
});
