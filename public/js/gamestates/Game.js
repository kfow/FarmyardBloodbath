// Main Game goes here
var Game = function(game){};

var animals = ['pig','sheep', 'cow', 'horse', 'pig2', 'sheep2', 'cow2', 'horse2', 'evil2'];
var socket; // Socket connection
var animalType;
var land;
var player;
var enemies;
var dual = false;
var soundbite;
var hay;
var barn;
var travelSpeed = 200;
var currentSpeed = 0;
var cursors;
var fireRate = 150;  //Fire rate for bullets - to be defined by guns later
var nextFire = 0;
var bullets;
var self;
var fx = {};
var dualCount = 0; //variable only used for dual weilding
var health = 5;
var bulletId = (((1+Math.random())*0x10000)|0).toString(16).substring(1);
var fireType = "single";
var heart = null;
var lastDrawnHealth = null;

Game.prototype  = {

  preload: function(){
    // Define Self
    self = this;
    var sprites = ["assets/ElSheepoSingle.png", "assets/ElSheepoDuel.png"];
    game.load.image('enemy', sprites[Math.floor(Math.random() * 2)]);
    game.load.image('earth', 'assets/light_grass.png');
    game.load.image('pig2', 'assets/ElPiggoDuel.png');
    game.load.image('sheep2', 'assets/ElSheepoDuel.png');
    game.load.image('cow2', 'assets/ElCowoDuel.png');
    game.load.image('cow', 'assets/ElCowoSingle.png');
    game.load.image('pig', 'assets/ElPiggoSingle.png');
    game.load.image('sheep', 'assets/ElSheepoSingle.png');
    game.load.image('evil2', 'assets/ElEvilDuel.png');
    game.load.image('horse', 'assets/tapirSingle.gif');
    game.load.image('horse2', 'assets/ElTapirDuel.gif');
    game.load.image('bullet', 'assets/bullet.png');
    game.load.image('hay', 'assets/hay.png');
    game.load.audio('pig_happy', 'sounds/pig_happy.mp3');
    game.load.audio('horse_happy', 'sounds/horse_happy.mp3');
    game.load.audio('sheep_happy', 'sounds/sheep_happy.mp3');
    game.load.audio('cow_happy', 'sounds/cow_happy.mp3');
    game.load.audio('troll', 'sounds/troll.mp3');
    game.load.image('barn', 'assets/barn.png');
    game.load.image('heart5', 'assets/Heart5.png');
    game.load.image('heart4', 'assets/Heart4.png');
    game.load.image('heart3', 'assets/Heart3.png');
    game.load.image('heart2', 'assets/Heart2.png');
    game.load.image('heart1', 'assets/Heart1.png');
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
    self.loadAudio();

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

    //Generate random animal
    var test = Math.floor(Math.random() *  (animals.length ));
    animalType = animals[test];
    //set player sprite
    player = game.add.sprite(startX, startY, animalType);

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

    bullets = game.add.group();
    bullets.enableBody = true;
    bullets.physicsBodyType = Phaser.Physics.ARCADE;

    bullets.createMultiple(50, 'bullet');
    bullets.setAll('checkWorldBounds', true);
    bullets.setAll('outOfBoundsKill', true);

    //work out character properties
    soundbite = animalType;
    if (soundbite.charAt(soundbite.length - 1) == '2'){
      soundbite = soundbite.substr(0, soundbite.length-1);
      dual = true;
    }
    //set fire type
    if (Math.floor(Math.random() * 4) ==1){
      fireType = 'triple';
      //triple firetype - if also duel slow speed
      if(dual == true){
        fireRate += (20 + Math.floor(Math.random() * 40));
        travelSpeed -= (Math.floor(Math.random() * 40));
      }
    }
    fireRate += (Math.floor(Math.random() * 90)) - 40;
    if(fireRate > 210 && !(dual == true && fireType == 'triple')){
        travelSpeed += (Math.floor(Math.random() * 100));
    }
    if (fireType == 'triple' && animalType != 'evil2'){
      fireRate+=30;
    }

    if (animalType == 'evil2'){
      fireRate -= 30;
      travelSpeed += 100;
    }

    // Start listening for events
    self.setEventHandlers();
  },

  drawHealthBar : function(health){
    // the bar itself
    // if health has changed, draw new sprite

    if (health != lastDrawnHealth){
       if (heart != null){
         heart.destroy();
       };

       heart = game.add.sprite(0, 0, 'heart' + (health).toString());
       heart.scale.x -= 0.5;
       heart.scale.y -= 0.5;
       heart.bringToTop();
       lastDrawnHealth = health;
     }
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
    socket.emit('new player', { x: player.x, y: player.y, angle: player.angle, animal: animalType, bulletId: bulletId});
  },

  // Socket disconnected
  onSocketDisconnect : function() {
    console.log('Disconnected from socket server');
  },

  // New player
  onNewPlayer : function(data) {
    console.log('New player connected:', data.id);

    // Avoid possible duplicate players
    var duplicate = self.playerById(data.id);
    if (duplicate) {
      console.log('Duplicate player!');
      return;
    }

    // Add new player to the remote players array
    enemies.push(new RemotePlayer(data.id, game, player, data.x, data.y, data.angle, data.animal, data.bulletId));
  },

  // Move player
  onMovePlayer: function(data) {
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
    fx['troll'] = game.add.audio('troll');
    // Remove player from array
    enemies.splice(enemies.indexOf(removePlayer), 1);
  },

  update : function() {
    game.physics.arcade.collide(player, hay);
    game.physics.arcade.collide(player, barn);
    game.physics.arcade.collide(bullets, hay, function(bullet){bullet.kill();}, null, self);
    game.physics.arcade.collide(bullets, barn, function(barn, bullet){bullet.kill();}, null, bullets);
    game.physics.arcade.collide(bullets, player, self.collisionHandler, null, self);
    // game.physics.arcade.collide(bullets, player, function(yourPlayer, bullet){
    //   if (bullet.bulletId !== bulletId) {
    //     bullet.kill();
    //     socket.emit('player hit', 1);
    //   };
    // }, null, self);


    for (var i = 0; i < enemies.length; i++) {
      if (enemies[i].alive) {
        enemies[i].update();
        game.physics.arcade.collide(player, enemies[i].player);
        game.physics.arcade.collide(bullets, enemies[i].player, function(yourPlayer, bullet){
          if (bullet.bulletId !== enemies[i].bulletId) {
            bullet.kill();
          };
        }, null, self);
      }
    }

    if (cursors.left.isDown) {
      player.angle -= 4;
    } else if (cursors.right.isDown) {
      player.angle += 4;
    }

    if (cursors.up.isDown) {
      // The speed we'll travel at
      currentSpeed = travelSpeed;
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

      // TODO Pass in fireType, default right now
      // Available options so far: Triple
      self.sendFire(fireType);
    }

    // collision detection for bullets + players

    socket.emit('move player', { x: player.x, y: player.y, angle: player.angle });

    self.drawHealthBar(health);
  },

  // I think the parameters are swapped for some ridiculous reason
  collisionHandler: function(tempPlayer, bullet) {

    if (bullet.bulletId != bulletId){
      health = health - 1;
      //socket.emit('player hit', 1);
      if (health < 1) {
        console.log("I died");
        //change game state here!
        socket.emit('player dead',{});
        player.kill();
        //CHANGE STATE!
        //game.state.start("GameMenu");
        location.reload();
      }
    }
    bullet.kill();
  },

  gotHit: function(data) {
    hitPlayer = self.playerById(data.id.id);  //gets player who got hit
    hitPlayer.health = hitPlayer.health - data.damage;
    if (hitPlayer.health < 1) {
      hitPlayer.player.kill();
    }
  },
  generateMasterTerrain: function (){
    var terrain = [];
    // generate array of dictonaries defining terrain:
    var numberOfHay = Math.round(Math.random() * 11) + 8;
    for (i = 0; i < numberOfHay; i++){
      terrain.push({x : Math.random() , y: Math.random() , object: 'hay'});
    }
    terrain.push({x : Math.random() , y: Math.random() , object: 'barn'});
    terrain.push({x : Math.random() , y: Math.random() , object: 'barn'});
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
          if (terrain[i].object == 'hay'){
            hay.create(Math.floor(terrain[i].x * w), Math.floor(terrain[i].y * h), terrain[i].object);
          }
          else {
            barn = game.add.sprite(Math.floor(terrain[i].x * w), Math.floor(terrain[i].y * w), 'barn');
            barn.scale.x += 0.75;
            barn.scale.y += 0.75;
            barn.anchor.setTo(0.5, 0.5);
            game.physics.enable(barn, Phaser.Physics.ARCADE);
            barn.body.maxVelocity.setTo(400, 400);
            barn.body.collideWorldBounds = true;
            barn.body.immovable = true;
	          barn.body.collideWorldBounds = true;
	          barn.body.checkCollision.right = false;
	          barn.body.checkCollision.left = false;
            barn.bringToTop();
          }
      }
      hay.forEach(function (x) {
          x.body.immovable = true;
      });
      hay.scale.x -= 0.25;
      hay.scale.y -= 0.25;
  },

  sendFire: function(fireType){
    if (game.time.now > nextFire)
      {
        //Calculate sound to play and if they are dual weilding

        //Calculate parameters for bullet
        if(dual == false || (dualCount==0)){
          var point = new Phaser.Point(player.body.x + 90, player.body.y -2);
          dualCount++;
        }else{
          var point = new Phaser.Point(player.body.x + 90, player.body.y +38);
          dualCount=0;
        }

        point.rotate(player.x, player.y, player.rotation);

        socket.emit('fire bullet', { x: point.x, y: point.y, rotation: player.rotation, velocity: 1000, lifespan: 2000, fireType: fireType });
        nextFire  = game.time.now + fireRate;
        //Call actualfire with data
        self.actualFire({fireType: fireType, x: point.x, y: point.y, rotation: player.rotation, velocity: 1000, lifespan: 2000 });
        fx[soundbite].play();
      }
  },

  actualFire: function(data){

    // Basic Code for triple shot!
    if (data.fireType === "triple"){
      var bullet;
      var fireRotation;
      var i;
      for (i = 0; i < 3; i++){
        bullet = bullets.getFirstExists(false);
        if (bullet) {bullet.reset(data.x, data.y);
        bullet.lifespan = data.lifespan;
        bullet.rotation = data.rotation;
        bullet.bulletId = bulletId;
        if (i === 0)  {fireRotation = data.rotation;}
        if (i === 1)  {fireRotation = data.rotation - 0.4;}
        if (i === 2)  {fireRotation = data.rotation + 0.4;}

        game.physics.arcade.velocityFromRotation(fireRotation, data.velocity, bodyullet.body.velocity);
      }
      }
    } else {
      bullet = bullets.getFirstExists(false);
      if (bullet){
        bullet.reset(data.x, data.y);
        bullet.lifespan = data.lifespan;
        bullet.rotation = data.rotation;
        game.physics.arcade.velocityFromRotation(data.rotation, data.velocity, bullet.body.velocity);
      }
    }
  },

  loadAudio: function(){
      fx['pig'] = game.add.audio('pig_happy');
      fx['troll'] = game.add.audio('troll');
      fx['sheep'] = game.add.audio('sheep_happy');
      fx['cow'] = game.add.audio('cow_happy');
      fx['horse'] = game.add.audio('horse_happy');
      fx['evil'] = game.add.audio('troll');
  }
}
