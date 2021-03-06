var util = require('util')
var http = require('http')
var path = require('path')
//var ecstatic = require('ecstatic')
var express = require('express');

var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var Player = require('./lib/Player')

app.disable('x-powered-by');

var handlebars = require('express-handlebars').create({defaultLayout:'main'});

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

// Set port
var port = process.env.PORT || 3000
app.set('port', port);

// set static to /public
app.use(express.static(__dirname + '/public'));

/* ---------------------------------------------------------------------------
 * GAME VARIABLES
------------------------------------------------------------------------------ */
var socket;	// Socket controller
var players;	// Array of connected players
var terrain; // Details of terrain -- currently just haybails

/* ---------------------------------------------------------------------------
 * GAME INITIALISATION
------------------------------------------------------------------------------ */
// Create and start the http server
server = app.listen(app.get('port'), function(err) {
  if (err) {
    throw err;
  }
  console.log('Server started press Ctrl-C to terminate');
  init();

})

function init () {
  // Create an empty array to store players
  players = [];
  // Attach Socket.IO to server
  socket = io.listen(server);
  // Start listening for events
  setEventHandlers();
}

/* ---------------------------------------------------------------------------
 * GAME EVENT HANDLERS
------------------------------------------------------------------------------ */

var setEventHandlers = function () {
  // Socket.IO
  socket.sockets.on('connection', onSocketConnection);
}

// New socket connection
function onSocketConnection (client) {
  util.log('New player has connected: ' + client.id);
  // Listen for client disconnected
  client.on('disconnect', onClientDisconnect);
  // Listen for new player message
  client.on('new player', onNewPlayer);
  // Listen for move player message
  client.on('move player', onMovePlayer);
  // Listen for emitting a bullet
  client.on('fire bullet', fireBullet);
  // Listen for player being hit
  client.on('player hit', playerHit);
  // Listen for master terrain details
  client.on('terrain', saveTerrain);
  //listen for dead player
  client.on('player dead', playerDied);
}



function playerHit (data) {
  this.broadcast.emit('player hit', {id:playerById(this.id), damage: data})
}
//player died function
function playerDied () {
  util.log('Player has died, RIP: ' + this.id)
  var removePlayer = playerById(this.id)
  // Player not found
  if (!removePlayer) {
    util.log('Dead player not found: ' + this.id)
    return
  }
  // Remove player from players array
  players.splice(players.indexOf(removePlayer), 1)
  // Broadcast removed player to connected socket clients
  this.broadcast.emit('remove player', {id: this.id})
}
// Socket client has disconnected
function onClientDisconnect () {
  util.log('Player has disconnected: ' + this.id)
  var removePlayer = playerById(this.id)
  // Player not found
  if (!removePlayer) {
    util.log('Player not found: ' + this.id)
    return
  }
  // Remove player from players array
  players.splice(players.indexOf(removePlayer), 1)
  // Broadcast removed player to connected socket clients
  this.broadcast.emit('remove player', {id: this.id})
}

// New player has joined
function onNewPlayer (data) {
  // Create a new player
  var newPlayer = new Player(data.x, data.y, data.angle, data.animal)
  newPlayer.id = this.id

  // Broadcast new player to connected socket clients
  this.broadcast.emit('new player', {id: newPlayer.id, x: newPlayer.getX(), y: newPlayer.getY(), angle: newPlayer.getAngle(), animal: newPlayer.animal})
  // Send existing players to the new player
  var i, existingPlayer
  for (i = 0; i < players.length; i++) {
    existingPlayer = players[i]
    this.emit('new player', {id: existingPlayer.id, x: existingPlayer.getX(), y: existingPlayer.getY(), angle: existingPlayer.getAngle(), animal: existingPlayer.animal})
  }
  // Add new player to the players array
  players.push(newPlayer)

  if(players.length<= 1){
    //this is the first player, use their co-ords for terrain objects
    this.emit('generate master terrain',{});
  } else{
    this.emit('terrain', terrain);
  }
}

// Player has moved
function onMovePlayer (data) {
  // Find player in array
  var movePlayer = playerById(this.id)

  // Player not found
  if (!movePlayer) {
    util.log('Player not found: ' + this.id)
    return
  }

  // Update player position
  movePlayer.setX(data.x)
  movePlayer.setY(data.y)
  movePlayer.setAngle(data.angle)

  // Broadcast updated position to connected socket clients
  this.broadcast.emit('move player', {id: movePlayer.id, x: movePlayer.getX(), y: movePlayer.getY(), angle: movePlayer.getAngle()})
}

// base directory
app.get('/', function(req, res){
  res.render('home');
});

app.use(function(req, res, next){
  console.log("Looking for URL " + req.url);
  next();
});

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

// Spawns bullet in foreign games
function fireBullet(data) {
   this.broadcast.emit('fire bullet', data)
}
function saveTerrain(data){
  terrain = data;
}

/* ---------------------------------------------------------------------------
 * GAME HELPER FUNCTIONS
------------------------------------------------------------------------------ */
// Find player by ID
function playerById (id) {
  var i
  for (i = 0; i < players.length; i++) {
    if (players[i].id === id) {
      return players[i]
    }
  }

  return false
}
