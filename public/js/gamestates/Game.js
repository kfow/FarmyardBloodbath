// Main Game goes here
var Game = function(game){};

var socket; // Socket connection
var land;
var player;
var enemies;
var hay;
var currentSpeed = 0;
var cursors;
var fireRate = 100;  //Fire rate for bullets - to be defined by guns later
var nextFire = 0;
var bullets;
var self;

Game.prototype  = {

  preload: function(){
    // Define Self
    self = this;
    var sprites = ["assets/ElSheepoSingle.png", "assets/ElSheepoDuel.png"];
    game.load.image('enemy', sprites[Math.floor(Math.random() * 2)]);
    game.load.image('earth', 'assets/light_grass.png');
    game.load.image('dude', 'assets/ElPiggoSingle.png');
    game.load.image('bullet', 'assets/bullet.png');
    game.load.image('hay', 'assets/hay.png');
  },

  // Find player by ID
  playerById : function(id) {
    for (var i = 0; i < enemies.length; i++) {
      if (enemies[i].player.name === id) {
        return enemies[i];
      }
    }
    return false;
  },

  setEventHandlers: function() {

    // Socket connection successful
    socket.on('connect', self.onSocketConnected);

    // Socket disconnection
    socket.on('disconnect', self.onSocketDisconnect);

    // New player message received
    socket.on('new player', self.onNewPlayer);

    // Player move message received
    socket.on('move player', self.onMovePlayer);

    // Player removed message received
    socket.on('remove player', self.onRemovePlayer);

    // Enemy shoots a bullet
    socket.on('fire bullet', self.actualFire);

    // enemy got hit
    socket.on('player hit', self.gotHit);

    // get player to generate and echo layout to server
    socket.on('generate master terrain', self.generateMasterTerrain);

    // set terrain to master
    socket.on('terrain', self.drawTerrain);
  },


  create: function() {

    var width = w
    var height = h

    socket = io.connect();
    self.spaceKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

    //  Stop the following keys from propagating up to the browser
    game.input.keyboard.addKeyCapture([ Phaser.Keyboard.LEFT, Phaser.Keyboard.RIGHT, Phaser.Keyboard.SPACEBAR ]);
    // Resize our game world to be a 2000 x 2000 square
    game.world.setBounds(0, 0, width, height);

    // Our tiled scrolling background
    land = game.add.tileSprite(0, 0, width, height, 'earth');
    land.fixedToCamera = true;

    // The base of our player
    var startX = Math.floor(Math.random() * w);
    var startY = Math.floor(Math.random() * h);
    player = game.add.sprite(startX, startY, 'dude');
    player.scale.x -= 0.25;
    player.scale.y -= 0.25;
    player.anchor.setTo(0.5, 0.5);

    // This will force it to decelerate and limit its speed
    // player.body.drag.setTo(200, 200)
    game.physics.enable(player, Phaser.Physics.ARCADE);
    player.body.maxVelocity.setTo(400, 400);
    player.body.collideWorldBounds = true;

    // add hay bales
    /*
    var numberOfHay = Math.round(Math.random() * 9) + 1;
    hay = game.add.group();
    hay.enableBody = true;
    hay.physicsBodyType = Phaser.Physics.ARCADE;
    hay.createMultiple(numberOfHay, 'bullet');
    hay.setAll('checkWorldBounds', true);
    hay.setAll('outOfBoundsKill', true);
    for (i = 0; i < numberOfHay; i++){
      hay.create(Math.floor(Math.random() * w), Math.floor(Math.random() * h), 'hay');
    }
    hay.forEach(function (x) {
      x.body.immovable = true;
    });
    hay.scale.x -= 0.25;
    hay.scale.y -= 0.25; */

    // Create some baddies to waste :)
    enemies = [];
    player.bringToTop();

    game.camera.follow(player);
    game.camera.deadzone = new Phaser.Rectangle(150, 150, 500, 300);
    game.camera.focusOnXY(0, 0);

    cursors = game.input.keyboard.createCursorKeys();

    bullets = game.add.group();
    bullets.enableBody = true;
    bullets.physicsBodyType = Phaser.Physics.ARCADE;

    bullets.createMultiple(50, 'bullet');
    bullets.setAll('checkWorldBounds', true);
    bullets.setAll('outOfBoundsKill', true);

    // Start listening for events
    self.setEventHandlers();
  },

  // Socket connected
  onSocketConnected : function() {
    console.log('Connected to socket server');

    // Reset enemies on reconnect
    enemies.forEach(function (enemy) {
      enemy.player.kill();
    })
    enemies = [];

    // Send local player data to the game server
    socket.emit('new player', { x: player.x, y: player.y, angle: player.angle });
  },

  // Socket disconnected
  onSocketDisconnect : function() {
    console.log('Disconnected from socket server');
  },

  // New player
  onNewPlayer : function(data) {
    console.log(data)
    console.log('New player connected:', data.id);

    // Avoid possible duplicate players
    var duplicate = self.playerById(data.id);
    if (duplicate) {
      console.log('Duplicate player!');
      return;
    }

    // Add new player to the remote players array
    enemies.push(new RemotePlayer(data.id, game, player, data.x, data.y, data.angle));
  },

  // Move player
  onMovePlayer: function(data) {
    console.log("Move player");
    var movePlayer = self.playerById(data.id);

    // Player not found
    if (!movePlayer) {
      console.log('Player not found: ', data.id);
      return;
    }

    // Update player position
    movePlayer.player.x = data.x;
    movePlayer.player.y = data.y;
    movePlayer.player.angle = data.angle;
  },

  // Remove player
  onRemovePlayer : function(data) {
    var removePlayer = self.playerById(data.id);

    // Player not found
    if (!removePlayer) {
      console.log('Player not found: ', data.id);
      return;
    }

    removePlayer.player.kill();

    // Remove player from array
    enemies.splice(enemies.indexOf(removePlayer), 1);
  },

  update : function() {
    game.physics.arcade.collide(player, hay);
    game.physics.arcade.collide(hay, bullets);

    for (var i = 0; i < enemies.length; i++) {
      if (enemies[i].alive) {
        enemies[i].update();
        game.physics.arcade.collide(player, enemies[i].player);
        game.physics.arcade.collide(bullets, enemies[i].player);
      }
    }

    if (cursors.left.isDown) {
      player.angle -= 4;
    } else if (cursors.right.isDown) {
      player.angle += 4;
    }

    if (cursors.up.isDown) {
      // The speed we'll travel at
      currentSpeed = 200;
    } else {
      if (currentSpeed > 0) {
        currentSpeed -= 4;
      }
    }

    game.physics.arcade.velocityFromRotation(player.rotation, currentSpeed, player.body.velocity);

    if (currentSpeed > 0) {
      player.animations.play('move');
    } else {
      player.animations.play('stop');
    }

    land.tilePosition.x = -game.camera.x;
    land.tilePosition.y = -game.camera.y;

    if (game.input.activePointer.isDown) {
      if (game.physics.arcade.distanceToPointer(player) >= 10) {
        currentSpeed = 200;

        player.rotation = game.physics.arcade.angleToPointer(player);
      }
    }

    //shoots bullets
    if (self.spaceKey.isDown)
    {
      //calculate fire values and emit to server to fire from enemy
      self.sendFire();
    }

    // collision detection for bullets + players
    game.physics.arcade.overlap(bullets, player, self.collisionHandler, null, self);

    socket.emit('move player', { x: player.x, y: player.y, angle: player.angle })
  },

  // I think the parameters are swapped for some ridiculous reason
  collisionHandler: function(tempPlayer, bullet) {
    tempPlayer.kill;
    bullet.kill;
    socket.emit('player hit', 1);
  },

  gotHit: function(data) {
    hitPlayer = self.playerById(data.id.id);  //gets player who got hit
    hitPlayer.health = hitPlayer.health - data.damage;
    /*if (hitPlayer.health < 1) {
      hitPlayer.kill;
    }*/
  },
  generateMasterTerrain: function (){
    var terrain = [];
    // generate array of dictonaries defining terrain:
    var numberOfHay = Math.round(Math.random() * 9) + 1;
    for (i = 0; i < numberOfHay; i++){
      terrain.push({x : Math.random() , y: Math.random() , object: 'hay'});
    }
    console.log(terrain);
    socket.emit('terrain', terrain);
    self.drawTerrain(terrain);
  },

  drawTerrain: function (terrain){
      hay = game.add.group();
      hay.enableBody = true;
      hay.physicsBodyType = Phaser.Physics.ARCADE;
      hay.setAll('checkWorldBounds', true);
      hay.setAll('outOfBoundsKill', true);
      for (i = 0; i < terrain.length; i++){
          hay.create(Math.floor(terrain[i].x * w), Math.floor(terrain[i].y * h), terrain[i].object);
      }
      hay.forEach(function (x) {
          x.body.immovable = true;
      });
      hay.scale.x -= 0.25;
      hay.scale.y -= 0.25;
  },

  sendFire: function(){
    if (game.time.now > nextFire)
      {
        console.log("Sending fire bullet message");
        //Calculate parameters for bullet
        var point = new Phaser.Point(player.body.x + 90, player.body.y -2);
        point.rotate(player.x, player.y, player.rotation);
        socket.emit('fire bullet', { x: point.x, y: point.y, rotation: player.rotation, velocity: 1000, lifespan: 2000 });
        nextFire  = game.time.now + fireRate;
        //Call actualfire with data
        self.actualFire({ x: point.x, y: point.y, rotation: player.rotation, velocity: 1000, lifespan: 2000 });
      }
  },

  actualFire: function(data){
    bullet = bullets.getFirstExists(false);
    if (bullet){
      bullet.reset(data.x, data.y);
      bullet.lifespan = data.lifespan;
      bullet.rotation = data.rotation;
      game.physics.arcade.velocityFromRotation(data.rotation, data.velocity, bullet.body.velocity);
    }
  }

}
