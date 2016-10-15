// Main Game goes here
var Game = function(game){};

var socket; // Socket connection
var land;
var player;
var enemies;
var currentSpeed = 0;
var cursors;
var fireRate = 100;
var nextFire = 0;
var bullets;

Game.prototype  = {

  preload: function(){
    var sprites = ["assets/ElSheepoSingle.png"];
    game.load.image('enemy', sprites[Math.floor(Math.random() * 3)]);
    game.load.image('earth', 'assets/light_grass.png');
    game.load.image('dude', 'assets/ElPiggoSingle.png');
    game.load.image('bullet', 'assets/bullet.png');
  },

  setEventHandlers: function() {
    // Socket connection successful
    socket.on('connect', this.onSocketConnected);

    // Socket disconnection
    socket.on('disconnect', this.onSocketDisconnect);

    // New player message received
    socket.on('new player', this.onNewPlayer);

    // Player move message received
    socket.on('move player', this.onMovePlayer);

    // Player removed message received
    socket.on('remove player', this.onRemovePlayer);
  },

  create: function() {
    var width = w
    var height = h

    socket = io.connect();
  this.spaceKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

      //  Stop the following keys from propagating up to the browser
      game.input.keyboard.addKeyCapture([ Phaser.Keyboard.LEFT, Phaser.Keyboard.RIGHT, Phaser.Keyboard.SPACEBAR ]);
    // Resize our game world to be a 2000 x 2000 square
    game.world.setBounds(-500, -500, width, height);

    // Our tiled scrolling background
    land = game.add.tileSprite(0, 0, width, height, 'earth');
    land.fixedToCamera = true;

    // The base of our player
    var startX = Math.round(Math.random() * (1000) - 500);
    var startY = Math.round(Math.random() * (1000) - 500);
    player = game.add.sprite(startX, startY, 'dude');
    player.scale.x -= 0.25;
    player.scale.y -= 0.25;
    player.anchor.setTo(0.5, 0.5);

    // This will force it to decelerate and limit its speed
    // player.body.drag.setTo(200, 200)
    game.physics.enable(player, Phaser.Physics.ARCADE);
    player.body.maxVelocity.setTo(400, 400);
    player.body.collideWorldBounds = true;

    // Create some baddies to waste :)
    enemies = [];

    player.bringToTop();

    game.camera.follow(player);
    game.camera.deadzone = new Phaser.Rectangle(150, 150, 500, 300);
    game.camera.focusOnXY(0, 0);

    cursors = game.input.keyboard.createCursorKeys();

    // Start listening for events

    bullets = game.add.group();
      bullets.enableBody = true;
      bullets.physicsBodyType = Phaser.Physics.ARCADE;

      bullets.createMultiple(50, 'bullet');
      bullets.setAll('checkWorldBounds', true);
      bullets.setAll('outOfBoundsKill', true);

    this.setEventHandlers();
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
    console.log('New player connected:', data.id);

    // Avoid possible duplicate players
    var duplicate = playerById(data.id);
    if (duplicate) {
      console.log('Duplicate player!');
      return;
    }

    // Add new player to the remote players array
    enemies.push(new RemotePlayer(data.id, game, player, data.x, data.y, data.angle));
  },

  // Move player
  onMovePlayer: function(data) {
    var movePlayer = playerById(data.id);

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
    var removePlayer = playerById(data.id);

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
    for (var i = 0; i < enemies.length; i++) {
      if (enemies[i].alive) {
        enemies[i].update();
        game.physics.arcade.collide(player, enemies[i].player);
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
    if (this.spaceKey.isDown)
    //if (game.input.spacebar.isDown)
    {
        fire();
    }



    //game.physics.arcade.overlap()

    socket.emit('move player', { x: player.x, y: player.y, angle: player.angle })
  },

  fire: function() {

    if (game.time.now > nextFire)
      {
          bullet = bullets.getFirstExists(false);

          if (bullet)
          {
              var point = new Phaser.Point(player.body.x + 90, player.body.y -2);
              point.rotate(player.x, player.y, player.rotation);
              bullet.reset(point.x, point.y);
              bullet.lifespan = 2000;
              bullet.rotation = player.rotation;
              game.physics.arcade.velocityFromRotation(player.rotation, 700, bullet.body.velocity);
              nextFire  = game.time.now + fireRate; // changing fireRate changes how fast gun fires
          }
      }
  },

  // Find player by ID
  playerById : function(id) {
    for (var i = 0; i < enemies.length; i++) {
      if (enemies[i].player.name === id) {
        return enemies[i];
      }
    }

    return false;
  }

}