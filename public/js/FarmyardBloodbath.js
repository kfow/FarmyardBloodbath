//Global Variables

var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)

var game = new Phaser.Game(w, h, Phaser.AUTO, '', 'game')

var FarmyardBloodbath = function() {};

var gameOptions = {
    playSound: true,
    playMusic: true
};

var musicPlayer;

FarmyardBloodbath.prototype = {
    preload: function() {
        game.load.image('brand', 'assets/brand.png');
        game.load.script('Splash', 'js/gamestates/Splash.js');
    },

    create : function() {
        game.state.add('Splash', Splash);
        game.state.start('Splash');
    }
};

game.state.add('FarmyardBloodbath', FarmyardBloodbath);
game.state.start('FarmyardBloodbath');
