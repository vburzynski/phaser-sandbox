var buttonA;

function onDown() {
  console.log('down');
}

function onUp() {
  console.log('up');
}

var Dialog = function (x, y, dialogMachine, cursors, gamepad, game) {
  this.dialogMachine = dialogMachine;
  this.cursors = cursors;
  this.textIndex = -1;
  this.choiceIndex = 0;
  this.optionStart = 0;
  this.texts = [];
  this.isCursorDown = false;
  this.game = game;
  this.x = x;
  this.y = y;
  this.pad = gamepad.pad1;

  if (this.pad) {
    console.log("Number of Gamepads connected: " + gamepad.padsConnected);
    console.log("Gamepad 1 " + (gamepad.pad1.connected ? "is connected" : "inactive"));
    console.log("Gamepad 2 " + (gamepad.pad2.connected ? "is connected" : "inactive"));
    console.log("Gamepad 3 " + (gamepad.pad3.connected ? "is connected" : "inactive"));
    console.log("Gamepad 4 " + (gamepad.pad4.connected ? "is connected" : "inactive"));

    this.pad.addCallbacks(this, {
      onConnect: this.addButtons
    });
    if (this.pad.connected) {
      this.addButtons();
    }
  }

  this.cursors.up.onDown.add(this._onUpCursorDown, this);
  this.cursors.up.onUp.add(this._onUpCursorUp, this);
  this.cursors.down.onDown.add(this._onDownCursorDown, this);
  this.cursors.down.onUp.add(this._onDownCursorUp, this);
  this.cursors.enter.onDown.add(this._onActivate, this);

  this.reset();
};

// TODO dialog background
// TODO margins around text
// TODO limit highlighting to options
// TODO configurable highlight color
// TODO configurable text color

Dialog.prototype = {
  addButtons: function () {
    this.dpad_up = this.pad.getButton(Phaser.Gamepad.XBOX360_DPAD_UP);
    this.dpad_up.onDown.add(this._onUpCursorDown, this);
    this.dpad_up.onUp.add(this._onUpCursorUp, this);

    this.dpad_down = this.pad.getButton(Phaser.Gamepad.XBOX360_DPAD_DOWN);
    this.dpad_down.onDown.add(this._onDownCursorDown, this);
    this.dpad_down.onUp.add(this._onDownCursorUp, this);
  },

  _onActivate: function () {
    var choiceIndex = this.textIndex - this.optionStart;
    var edgeId = this.dialog.options[choiceIndex].edge;
    this.dialogMachine.activateEdge(edgeId);
    debugger;
    this.reset();
  },

  /**
   * Handles Down state of Up cursor
   */
  _onUpCursorDown: function () {
    this.prevOption();
    this.isCursorDown = 'up';
  },

  /**
   * Handles Up state of Up cursor
   */
  _onUpCursorUp: function () {
    if (this.isCursorDown === 'up') {
      this.isCursorDown = false;
    }
  },

  /**
   * Handles Down state of Down cursor
   */
  _onDownCursorDown: function () {
    this.nextOption();
    this.isCursorDown = 'down';
  },

  /**
   * Handles Up state of Down cursor
   */
  _onDownCursorUp: function () {
    if (this.isCursorDown === 'down') {
      this.isCursorDown = false;
    }
  },

  /**
   * Sets the next text gameobject
   * @private
   * @param   {Number}     x     x-axis position
   * @param   {Number}     y     y-axis position
   * @param   {Number}     index index for this text
   * @param   {String}     text  text string
   * @returns {BitmapText} BitmapText gameobject
   */
  _setText: function (x, y, index, text) {
    if (index < this.texts.length) {
      this.texts[index].setText(text);
      this.texts[index].x = x;
      this.texts[index].y = y;
    } else {
      this.texts[index] = this.game.add.bitmapText(x, y, 'arial', text, 32);
    }
    return this.texts[index];
  },

  /**
   * Resets the Dialog instance
   */
  reset: function () {
    var index = 0,
      text,
      len,
      i,
      y = this.y,
      x = this.x;

    this.dialog = this.dialogMachine.getDialog();

    if (this.dialog.message) {
      text = this._setText(x, y, index, this.dialog.message);
      y = text.y + text.height;
      index += 1;
      this.optionStart += 1;
    }

    if (this.dialog.text) {
      if (this.dialog.speaker) {
        text = this._setText(x, y, index, this.dialog.speaker + ": " + this.dialog.text);
      } else {
        text = this._setText(x, y, index, this.dialog.text);
      }
      y = text.y + text.height;
      index += 1;
      this.optionStart += 1;
    }

    len = this.dialog.options.length;
    for (i = 0; i < len; i += 1) {
      text = this._setText(x + 20, y, index, this.dialog.options[i].text);
      y = text.y + text.height;
      index += 1;
    }

    this.clearTexts(index);
  },

  clearTexts: function(index) {
    var i, len = this.texts.length;
    index = index || 0;
    for (i = index; i < len; i += 1) {
      this.texts[i].destroy();
    }
    this.texts = this.texts.slice(0,index);
  },

  /**
   * Destroys the Dialog instance
   */
  destroy: function () {
    var i, len;
    this.dialogMachine = null;
    this.cursors.up.onDown.remove(this._onUpCursorDown, this);
    this.cursors.up.onUp.remove(this._onUpCursorUp);
    this.cursors.down.onDown.remove(this._onDownCursorDown, this);
    this.cursors.down.onUp.remove(this._onDownCursorUp);
    this.cursors = null;
    len = this.texts.length;
    for (i = 0; i < len; i += 1) {
      this.texts[i].destroy();
    }
  },

  /**
   * Select the next option in the dialog
   */
  nextOption: function () {
    if (this.isCursorDown === false && this.textIndex < this.texts.length - 1) {
      if (this.textIndex > -1) {
        this.texts[this.textIndex].tint = 0xFFFFFF;
      }
      this.textIndex += 1;
      if (this.textIndex < this.optionStart) {
        this.textIndex = this.optionStart;
      }
      this.texts[this.textIndex].tint = 0xFF0000;
    }
  },

  /**
   * Select the previous option in the dialog
   */
  prevOption: function () {
    if (this.isCursorDown === false && this.textIndex > this.optionStart) {
      this.texts[this.textIndex].tint = 0xFFFFFF;
      this.textIndex -= 1;
      if (this.textIndex > -1) {
        this.texts[this.textIndex].tint = 0xFF0000;
      }
    }
  },

  /**
   * Sets the dialog up with new data
   * @param {Object} data dialog data object
   */
  set: function (dialogMachine) {
    this.dialogMachine = dialogMachine;
    this.resest();
  }
};

module.exports = Dialog;
