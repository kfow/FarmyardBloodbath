// Menu goes here

var GameMenu = function(game){};

GameMenu.prototype  = {
  preload: function() {
    game.load.image('startGame', 'assets/StartGame.png');
  },

  create: function() {
    var logo = game.add.sprite(w/2, h/4, 'brand');
    logo.anchor.setTo(0.5, 0.5);
    var startGame  = game.add.sprite(w/2, h/2, 'startGame')
    startGame.anchor.setTo(0.5, 0.5);
    startGame.inputEnabled = true;
    startGame.events.onInputUp.add(function(){
      game.state.start('Game');
    });
  }
}
