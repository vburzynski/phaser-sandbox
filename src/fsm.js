var _ = require('lodash'),
  $ = require('jquery'),
  EventsMixin = require('./mixins/events');

/*
data format:
{
    initial: "",
    states: {
        "name" : {
            onEnter: function(event, from, to){},
            onLeave: function(event, from, to){}
        }
    },
    events: [
        {
            name: "start",
            from: "*",
            to: "name",
            onBefore: function(from, to){},
            onAfter: function(from, to){}
        }
    ]
}
*/

/**
 * Finite State Machine Constructor
 * @param   {Object} data fsm data object
 * @returns {FSM}    new FSM object
 */
function FSM(data) {
  return new FSM.prototype.init(data);
}

/**
 * Helper function to transition the state of an fsm instance
 * @param {Object} fsm    FSM instance
 * @param {Object} event  The event which triggered the transition
 */
function _transition(fsm, event) {
  var target = event.to;

  if (target) {
    fsm.previous = fsm.state;
    fsm.state = target;

    // trigger before transition event
    _trigger(fsm, 'before', event.name, event, event);

    // switch states
    _exitState(fsm, fsm.previous, event);
    _enterState(fsm, fsm.state, event);

    // trigger after transition event
    _trigger(fsm, 'after', event.name, event, event);
  }
}

// Helper to trigger transitions
function _trigger(fsm, eventName, name, obj, eventObj) {
  var fnStr;
  fsm.emit(eventName.toLowerCase(), fsm.previous, fsm.state);
  fsm.emit(eventName.toLowerCase() + '-' + name, fsm.previous, fsm.state);

  fnStr = 'on' + eventName.charAt(0).toUpperCase() + eventName.slice(1);
  
  if (fsm && fsm[fnStr] && _.isFunction(fsm[fnStr])) {
    fsm[fnStr](eventObj, fsm.previous, fsm.state);
  }
  
  if (obj && obj[fnStr] && _.isFunction(obj[fnStr])) {
    obj[fnStr](eventObj, fsm.previous, fsm.state);
  }
}

// Helper to trigger exiting a state
function _exitState(fsm, stateName, event) {
  var state = fsm.states[stateName];
  _trigger(fsm, 'exit', stateName, state, event);
}

// Helper to trigger entering a state
function _enterState(fsm, stateName, event) {
  var state = fsm.states[stateName];
  _trigger(fsm, 'enter', stateName, state, event);
}

FSM.prototype = {
  // FUTURE event handler for error events? (transition failed)

  isRunning: false,
  WILDCARD: "*",
  state: null,
  states: [],
  events: [],
  initial: null,
  state: null,
  previous: null,

  /**
   * Constructor function for the Finite State Machine
   * @param   {object} data configuration data
   * @returns {FSM}    Finite State Machine
   */
  init: function (data) {
    this.isRunning = false;
    this.state = null;
    this.previous = null;
    this.initial = data.initial;
    this.states = (data && data.states) ? data.states : {};
    this.events = (data && data.events) ? data.events : [];

    // sort events by name
    this.events = _.sortBy(this.events, 'name');

    this.eventNames = _.map(this.events, 'name');

    return this;
  },

  /**
   * Adds a state
   * @param {Object} state state object data
   */
  addState: function (name, state) {
    this.states[name] = state;
    return this;
  },

  /**
   * Add an event
   * @param {Object} event event object data
   */
  addEvent: function (event) {
    // splice the event and event name into the sorted collections
    var index = _.sortedIndexBy(this.events, event, function(o) { return o.name; });
    this.events.splice(index, 0, event);
    this.eventNames.splice(index, 0, event.name);
    return this;
  },

  /**
   * Start the machine;
   */
  start: function () {
    this.stop();
    
    // when the initial state exists
    if (this.states[this.initial]) {
      // stop the fsm if it is running
      if (this.isRunning) {
        this.stop();
      }

      // set the starting state
      this.state = this.initial;
      this.isRunning = true;

      // emit events
      this.emit('start');
      if (this.onStart && _.isFunction(this.onStart)) {
        this.onStart(this);
      }

      // enter initial state
      this.emit('enter');
      this.emit('enter-' + this.state);
      var state = this.states[this.state];
      if (state.onEnter && _.isFunction(state.onEnter)) {
        state.onEnter(this);
      }
    }
  },

  /**
   * Stops the machine;
   */
  stop: function () {
    if (this.isRunning) {
      this.isRunning = false;
      this.state = null;
      this.previous = null;
      this.emit('stop');
      if (this.onStop && _.isFunction(this.onStop)) {
        this.onStop(this);
      }
    }
  },

  /**
   * Triggers a transition triggering state machine event
   * @param {String} eventName event name
   */
  trigger: function (eventName) {
    // grab all event transitions with the specified event name
    var events = _.filter(this.events, function (event) {
      return event.name === eventName;
    });

    // find an event that transitions from the state state
    _.forEach(events, function (event) {
      var fromArr = event.from.split(','),
        containsCurrentState = fromArr.indexOf(this.state) > -1;

      // initiate transition when event's `from` is set to the wildcard, or contains state state name
      if ((event.from === this.WILDCARD || containsCurrentState) && event.to) {
        _transition(this, event);
        return false;
      }
    }.bind(this));

    return this;
  },

  /**
   * Determine if machine is in a certain state
   * @param   {string}  name state name
   * @returns {boolean} true if fsm is in the designated state
   */
  is: function (name) {
    return this.state === name;
  },

  /**
   * Determine if an event can be triggered
   * @param {[[Type]]} event name of event
   */
  validTrigger: function (eventName) {
    var isValid = false;

    if (this.isRunning) {
      // grab all events matching the event name.
      var events = _.filter(this.events, function (event) {
        return event.name === eventName;
      });

      // check each event to see if it leads away from the current state.
      _.forEach(events, function (event) {
        var fromArr = event.from.split(','),
          containsCurrentState = fromArr.indexOf(this.state) > -1;
        if ((event.from === this.WILDCARD || containsCurrentState) && event.to) {
          isValid = true;
          return false;
        }
      }.bind(this));
    }

    return isValid;
  }
};

_.extend(FSM.prototype, EventsMixin);

FSM.prototype.init.prototype = FSM.prototype;

window.FSM = FSM;
module.exports = FSM;