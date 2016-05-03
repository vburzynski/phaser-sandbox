var $ = require('jquery'),
    _ = require('lodash');

window.PIXI   = require('../bower_components/phaser/build/custom/pixi.js');
window.p2     = require('../bower_components/phaser/build/custom/p2.js');
window.Phaser = require('../bower_components/phaser/build/custom/phaser-split.js');

var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'phaser-example', { create: create });

function create() {
    var text = "- phaser -\n with a sprinkle of \n pixi dust!";
    var style = { font: "65px Arial", fill: "#ff0044", align: "center" };
    var t = game.add.text(game.world.centerX-300, 0, text, style);
    console.log('hello world');
}
