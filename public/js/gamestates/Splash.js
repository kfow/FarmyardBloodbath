// Opening Splash Screen

var Splash = function(){};

Splash.prototype = {

  loadScripts: function(){
    game.load.script('GameMenu','js/gamestates/GameMenu.js');
    game.load.script('Game', 'js/gamestates/Game.js');
    game.load.script('Options', 'js/gamestates/Options.js');
  },

  addGameStates: function(){
    game.state.add('Game', Game);
    game.state.add('GameMenu', GameMenu);
    game.state.add('Options', Options);
  },

  init: function(){
    this.logo = game.make.sprite(game.world.centreX, 280, 'brand');
  },

  preload: function () {
    game.add.existing(this.logo).scale.setTo(4);

    this.loadScripts();
  },

  create: function() {
    console.log("Splash Create function");
    this.addGameStates();
    //this.addGameMusic();

    // Wait 1 Sec then go to Game Main Menu
    setTimeout(function(){
      game.state.start("GameMenu");
    }, 1000);
  }
}
