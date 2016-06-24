
export default {
  preload: function () {
    // TODO load preload image / bar
  },
  create: function () {
    // TODO detect device and configure scale
    // TODO configure inputs
    // TODO configure stage

    // start loading state
    this.game.state.start('load');
  }
};
