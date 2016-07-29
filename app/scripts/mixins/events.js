export default {

  /**
   * Registers a new event handler
   * @param   {String}   eventName name of the event
   * @param   {Function} handler   handler to execute when event occurs
   * @returns {this}     instance of object
   */
    on: function (eventName, handler) {
        if (this.eventHandlers === null || typeof this.eventHandlers === 'undefined') {
            this.eventHandlers = {};
        }
        if (this.eventHandlers[eventName] === null || typeof this.eventHandlers[eventName] === 'undefined') {
            this.eventHandlers[eventName] = [];
        }
        var arr = this.eventHandlers[eventName];
        arr[arr.length] = handler;
        return this;
    },

  /**
   * Unregisters an event handler or multiple event handlers
   * @param   {String}   eventName name of the event
   * @param   {Function} handler   handler to remove
   * @returns {this}     instance of object
   */
    off: function (eventName, handler) {
        if (eventName === null || typeof eventName === 'undefined' || eventName === '') {
            this.eventHandlers = {};
        } else if (eventName && (handler === null || typeof handler === 'undefined')) {
            this.eventHandlers[eventName] = [];
        } else if (eventName && handler && this.eventHandlers && this.eventHandlers[eventName]) {
            var i, e, len = this.eventHandlers[eventName].length;
            for (i; i < len; i++) {
                e = this.eventHandlers[eventName][i];
                if (e === handler) {
                    e.splice(i, 1);
                    return this;
                }
            }
        }
        return this;
    },

  /**
   * emit an event
   * @param   {String} eventName event name
   * @returns {this}   instance of object
   */
    emit: function (eventName) {
        if (this.eventHandlers === null || typeof this.eventHandlers === 'undefined') {
            return this;
        }
        if (this.eventHandlers[eventName] === null || typeof this.eventHandlers[eventName] === 'undefined') {
            return this;
        }
        var i, len = this.eventHandlers[eventName].length;
        for (i = 0; i < len; i++) {
            this.eventHandlers[eventName][i].call(null, arguments);
        }
        return this;
    }
};
