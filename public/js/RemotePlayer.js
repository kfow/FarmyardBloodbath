/* global game */

var RemotePlayer = function (index, game, player, startX, startY, startAngle, animal) {
  var x = startX;
  var y = startY;
  var angle = startAngle;

  this.game = game;
  this.health = 5;
  this.player = player;
  this.alive = true;

  this.player = game.add.sprite(x, y, animal);

  this.player.animations.add('move', [0], 20, true);
  this.player.animations.add('stop', [0], 20, true);

  this.player.scale.x -= 0.25;
  this.player.scale.y -= 0.25;
  this.player.anchor.setTo(0.5, 0.5);

  this.player.name = index.toString();
  game.physics.enable(this.player, Phaser.Physics.ARCADE);
  this.player.body.immovable = true;
  this.player.body.collideWorldBounds = true;

  this.player.angle = angle;

  this.lastPosition = { x: x, y: y, angle: angle }
}

RemotePlayer.prototype.update = function () {
  if (this.player.x !== this.lastPosition.x || this.player.y !== this.lastPosition.y || this.player.angle != this.lastPosition.angle) {
    this.player.play('move');
    this.player.rotation = Math.PI + game.physics.arcade.angleToXY(this.player, this.lastPosition.x, this.lastPosition.y);
  } else {
    this.player.play('stop');
  }

  this.lastPosition.x = this.player.x;
  this.lastPosition.y = this.player.y;
  this.lastPosition.angle = this.player.angle;
}

window.RemotePlayer = RemotePlayer;
