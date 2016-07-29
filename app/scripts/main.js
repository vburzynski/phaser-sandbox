import boot from './states/boot';
import load from './states/load';
import main from './states/main';

// new phaser game
var game = new Phaser.Game(800, 600, Phaser.AUTO, 'phaser-example');
game.state.add('boot', boot);
game.state.add('load', load);
game.state.add('main', main);
game.state.start('boot');

console.log('\'Allo \'Allo!');
