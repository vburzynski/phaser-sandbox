/*jslint bitwise:true */
import Dialog from '../gameobjects/dialog';
import DialogMachine from '../dialogMachine';
import dialog_tree from './conversation.json';

console.log('Dialog', Dialog);
console.log('DialogMachine', DialogMachine);
console.log('dialog_tree', dialog_tree);

var bmpText,
    stateName = '',
    cursors;

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

export default {
  /**
   * Preload all the assets for this state
   */
    preload: function () {
        this.game.load.bitmapFont('arial', 'fonts/arial_32.png', 'fonts/arial_32.xml');
    },

  /**
   * Create the initial state
   */
    create: function () {
        var dialogMachine = new DialogMachine(dialog_tree);
        dialogMachine.start();

        bmpText = this.game.add.bitmapText(10, 10, 'arial', 'Phaser & Pixi \nrocking!', 32);

        cursors = this.game.input.keyboard.addKeys({
            'up': Phaser.KeyCode.UP,
            'down': Phaser.KeyCode.DOWN,
            'left': Phaser.KeyCode.LEFT,
            'right': Phaser.KeyCode.RIGHT,
            'enter': Phaser.KeyCode.ENTER
        });

        var gamepad = this.game.input.gamepad;


        console.log('Number of Gamepads connected: ' + gamepad.padsConnected);

    // create dialog
        new Dialog(10, 200, dialogMachine, cursors, gamepad, this.game);

        gamepad.start();

    // update text color if down key pressed
        this.game.input.onDown.add(updateText, this);

    },

  /**
   * Update the state
   */
    update: function () {
    // generate some text that updates constantly
        bmpText.setText('Phaser & Pixi rocking!\n' + Math.round(this.game.time.now) + '\n' + stateName);
    }
};
