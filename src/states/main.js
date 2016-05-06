/*jslint bitwise:true */

var $ = require('jquery'),
  // fsm = require('fsm/main-fsm'),
  Dialog = require('../gameobjects/dialog'),
  // config = require('config/config'),
  bmpText,
  stateName = '',
  cursors,
  dialog;

// fsm.on('enter', function () {
//   $("#current-state").html(fsm.current);
//   stateName = fsm.current;
// });

// $('document').ready(function () {
//   fsm.start();
//   $('#next').click(function () {
//     fsm.trigger('next');
//   });
// });


/**
 * generateHexColor - generate a random hex color
 * @return {Number}  hex color
 */
function generateHexColor() {
  return ((0.5 + 0.5 * Math.random()) * 0xFFFFFF << 0);
}

function updateText() {
  bmpText.tint = generateHexColor();
}

/*
order:
  preload     - load game assets
  loadUpdate  - called during the Loader process
  loadRender  - called during the Loader process
  create      - called after preload is complete
  update      - called after debug, physics, plugins and Stage have had their preUpdate methods called
  render      - post-procesing style effects
  resize      - browser resizes Scalemode RESIZE
  paused      - called if the core game loop is paused
  pauseUpdate - called while the game is paused instead of preUpdate/update/postUpdate
  shutdown    - state is shutdown
*/

module.exports = {
  /**
   * Preload all the assets for this state
   */
  preload: function () {
    this.game.load.bitmapFont('arial', 'assets/fonts/arial_32.png', 'assets/fonts/arial_32.xml');
  },

  /**
   * Create the initial state
   */
  create: function () {

    var dialogConfig = {
      message: "Good Job!",
      speaker: "John",
      text: "What would you like to do?",
      options: [
        "Go home",
        "Carry on"
      ]
    };

    bmpText = this.game.add.bitmapText(10, 10, 'arial', 'Phaser & Pixi \nrocking!', 32);
    cursors = this.game.input.keyboard.addKeys({
      'up': Phaser.KeyCode.UP,
      'down': Phaser.KeyCode.DOWN,
      'left': Phaser.KeyCode.LEFT,
      'right': Phaser.KeyCode.RIGHT,
      'enter': Phaser.KeyCode.ENTER
    });

    var gamepad = this.game.input.gamepad;


    console.log("Number of Gamepads connected: " + gamepad.padsConnected);

    // create dialog
    dialog = new Dialog(10, 200, dialogConfig, cursors, gamepad, this.game);

    gamepad.start();

    // update text color if down key pressed
    this.game.input.onDown.add(updateText, this);

  },

  /**
   * Update the state
   */
  update: function () {
    // generate some text that updates constantly
    bmpText.setText('Phaser & Pixi rocking!\n' + Math.round(this.game.time.now) + "\n" + stateName);
  }
};
