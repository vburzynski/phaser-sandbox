/*jslint bitwise:true */

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
        this.game.add.bitmapText(10, 10, 'arial', 'Click to continue', 32);

        this.game.input.onDown.addOnce(function () {
            this.game.state.start('main', true, false);
        }, this);
    }
};
