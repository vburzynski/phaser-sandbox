/*jslint bitwise:true */

var $ = require('jquery'),
  bmpText,
  texts = [],
  stateName = '',
  cursors,
  textIndex = -1;

function generateHexColor() {
  return ((0.5 + 0.5 * Math.random()) * 0xFFFFFF << 0);
}

function updateText() {
  bmpText.tint = generateHexColor();
}

/*
state event order:
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

var isCursorDown = false;

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
    bmpText = this.game.add.bitmapText(10, 10, 'arial', 'Click to continue', 32);

    this.game.input.onDown.addOnce(function () {
      this.game.state.start('main', true, false);
    }, this);
  }
};
