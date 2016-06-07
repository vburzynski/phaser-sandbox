var $ = require('jquery'),
  _ = require('lodash'),
  game;

// I believe these need to be in the global context to work
var PIXI = window.PIXI = require('../bower_components/phaser/build/custom/pixi.js');
window.p2 = require('../bower_components/phaser/build/custom/p2.js');
window.Phaser = require('../bower_components/phaser/build/custom/phaser-split.js');

// new phaser game
game = new Phaser.Game(800, 600, Phaser.AUTO, 'phaser-example');

game.state.add('boot', require('./states/boot'));
game.state.add('load', require('./states/load'));
game.state.add('main', require('./states/main'));

// start first state
game.state.start('boot');

// TODO - potentially try babel in place of browserify or try babelify