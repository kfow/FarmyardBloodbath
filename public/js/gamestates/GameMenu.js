// Menu goes here

var GameMenu = function(game){};


GameMenu.prototype  = {
  create: function() {

    console.log("GameMenu Create")

    var logo = game.add.sprite(game.world.centreX, game.world.centreY, 'brand');
    logo.inputEnabled = true;
    logo.events.onInputUp.add(function(){
      console.log("Clicked!")
      game.state.start('Game');
    });
  }
}
