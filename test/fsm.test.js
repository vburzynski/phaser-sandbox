/*jshint -W030 */
/*globals _, describe, context, it, before, beforeEach, chai, sinon, FSM */

var assert = chai.assert;
var expect = chai.expect;

describe('Array', function () {
  describe('#indexOf()', function () {
    it('should return -1 when the value is not present', function () {
      assert.equal(-1, [1, 2, 3].indexOf(5));
      assert.equal(-1, [1, 2, 3].indexOf(0));
    });
  });
});

describe('FSM', function () {
  var data = {
    initial: 'home',
    states: {
      "home": {},
      "state2": {}
    },
    events: [
      {
        name: "start",
        from: "home",
        to: "state2"
      },
      {
        name: "next",
        from: "state2",
        to: "home"
      },
      {
        name: "reset",
        from: "*",
        to: "home"
      }
    ]
  };

  describe('constructor', function () {
    var fsm = FSM(data);

    it('should create an fsm that is not running', function () {
      expect(fsm.isRunning).to.be.false;
    });

    it('should not have a current state', function () {
      expect(fsm.state).to.be.null;
    });

    it('should not have a previous state', function () {
      expect(fsm.state).to.be.null;
    });

    it('should set the initial state', function () {
      expect(fsm.initial).to.equal(data.initial);
    });
  });

  describe('#addState', function () {
    it("should add a new state to the fsm state nodes", function () {
      var fsm = FSM(data);
      var stateObj = {
        onExit: function () {}
      };

      fsm.addState('state3', stateObj);

      expect(fsm.states).to.include.keys('state3');
      expect(fsm.states.state3).to.equal(stateObj);
    });
  });

  describe('#addEvent', function () {
    beforeEach(function () {
      this.fsm = FSM({
        initial: 'a',
        states: {
          "a": {},
          "b": {}
        },
        events: [
          { name: "a", from: "a", to: "b" },
          { name: "c", from: "b", to: "a" }
        ]
      });
      this.newEvent = {
        name: 'b',
        from: 'b',
        to: 'a'
      };
      this.fsm.addEvent(this.newEvent);
    });

    it("should add a new transition triggering event to the fsm.", function () {
      expect(this.newEvent).to.be.oneOf(this.fsm.events);
    });

    it("should add the event while maintaining the correct sorted event order.", function(){
      expect(this.fsm.eventNames.indexOf(this.newEvent.name)).to.equal(1);
    });
    
    it("should update the eventName collection that maps the name to the sorted index.", function(){
      expect(this.newEvent.name).to.be.oneOf(this.fsm.eventNames);
    });
  });

  describe('#start()', function () {
    beforeEach(function () {
      this.fsm = FSM(data);
    });

    it("should start the machine", function () {
      this.fsm.start();
      expect(this.fsm.isRunning).to.be.true;
    });

    it("should trigger the machine to emit a start event", function () {
      var spy = sinon.spy();
      this.fsm.on('start', spy);
      this.fsm.start();

      expect(spy.called).to.be.true;
      expect(spy.calledOnce).to.be.true;
    });

    it("should cause the machine to emit start events in order", function () {
      var spy = sinon.spy();
      this.fsm.on('enter', spy);
      this.fsm.on('start', spy);
      this.fsm.on('enter-home', spy);
      this.fsm.start();

      expect(spy.called).to.be.true;
      expect(spy.calledOnce).to.be.false;
      expect(spy.callCount).to.equal(3);
      expect(spy.firstCall.args[0][0]).to.equal("start");
      expect(spy.secondCall.args[0][0]).to.equal("enter");
      expect(spy.thirdCall.args[0][0]).to.equal("enter-home");
    });

    it("should execute the fsm's onStart event handler", function () {
      var spy = sinon.spy();
      this.fsm.onStart = spy;
      this.fsm.start();

      expect(spy.called).to.be.true;
      expect(spy.calledOnce).to.be.true;
    });

    it("should execute the fsm's onEnter event handler", function () {
      var spy = sinon.spy(),
        data2 = _.cloneDeep(data);

      data2.states.home.onEnter = spy;
      this.fsm = FSM(data2);
      this.fsm.start();

      expect(spy.called).to.be.true;
      expect(spy.calledOnce).to.be.true;
    });

    it("should set the current state to equal the initial state", function () {
      this.fsm.start();
      expect(this.fsm.state).to.be.equal(data.initial);
    });

    it("results in the machine not having a previous state", function () {
      this.fsm.start();
      expect(this.fsm.previous).to.be.null;
    });

    it("should reset the FSM (by stopping and starting again) when start is called subsequent times", function () {
      this.fsm.start();
      expect(this.fsm.isRunning).to.be.true;

      var spy = sinon.spy();
      this.fsm.onStop = spy;
      this.fsm.start();
      expect(spy.called).to.be.true;
      expect(spy.calledOnce).to.be.true;
      expect(this.fsm.isRunning).to.be.true;
    });
  });

  describe('#stop', function () {
    beforeEach(function () {
      this.fsm = FSM(data);
      this.fsm.start();
    });

    it("should stop the machine", function () {
      this.fsm.stop();
      expect(this.fsm.isRunning).to.be.false;
    });

    it("should clear the current state", function () {
      expect(this.fsm.state).to.equal(data.initial);
      this.fsm.stop();
      expect(this.fsm.state).to.be.null;
    });

    it("should clear the previous state", function () {
      this.fsm.trigger('start');
      expect(this.fsm.state).to.equal('state2');
      this.fsm.stop();
      expect(this.fsm.previous).to.be.null;
    });

    it("should cause the machine to emit a stop event", function () {
      var spy = sinon.spy();
      this.fsm.on('stop', spy);
      this.fsm.stop();
      expect(spy.called).to.be.true;
      expect(spy.calledOnce).to.be.true;
    });

    it("should execute the fsm's onStop event handler", function () {
      var spy = sinon.spy();
      this.fsm.onStop = spy;
      this.fsm.stop();
      expect(spy.called).to.be.true;
      expect(spy.calledOnce).to.be.true;
    });

    it("should do nothing if the fsm was never started", function () {
      var fsm = new FSM(data);
      var spy = sinon.spy();
      fsm.onStop = spy;
      fsm.stop();
      expect(spy.called).to.be.false;
    });

    it("should only stop once if called more than once in a row", function () {
      var spy = sinon.spy();
      this.fsm.onStop = spy;
      this.fsm.stop();
      this.fsm.stop();
      expect(spy.called).to.be.true;
      expect(spy.calledOnce).to.be.true;
    });
  });

  describe('#trigger', function () {
    // Start a new FSM before each
    beforeEach(function () {
      this.fsm = FSM(data);
      this.fsm.start();
    });

    context('when event is invalid', function () {
      context('when event is not specified by the fsm configuration.', function () {
        it("should not change from the current state.", function () {
          expect(this.fsm.state).to.equal(data.initial);
          this.fsm.trigger("does-not-exist");
          expect(this.fsm.state).to.equal(data.initial);
        });
      });
      context('when event does not lead away from the current state.', function () {
        it("should not change from the current state.", function () {
          expect(this.fsm.state).to.equal(data.initial);
          this.fsm.trigger("next");
          expect(this.fsm.state).to.equal(data.initial);
        });
      });
    });

    describe('when event is valid', function () {
      var copy = _.cloneDeep(data);

      before(function () {
        this.onExitSpy = copy.states.home.onExit = sinon.spy();
        this.onEnterSpy = copy.states.state2.onEnter = sinon.spy();
        this.onBeforeSpy = copy.events[0].onBefore = sinon.spy();
        this.onAfterSpy = copy.events[0].onAfter = sinon.spy();

        this.onBeforeFSMSpy = copy.onBefore = sinon.spy();
        this.onExitFSMSpy = copy.onExit = sinon.spy();
        this.onEnterFSMSpy = copy.onEnter = sinon.spy();
        this.onAfterFSMSpy = copy.onAfter = sinon.spy();

        this.fsm = FSM(copy);
        this.fsm.start();

        this.spy = sinon.spy();
        this.fsm.on('before', this.spy);
        this.fsm.on('before-start', this.spy);
        this.fsm.on('exit', this.spy);
        this.fsm.on('exit-home', this.spy);
        this.fsm.on('enter', this.spy);
        this.fsm.on('enter-state2', this.spy);
        this.fsm.on('after', this.spy);
        this.fsm.on('after-start', this.spy);

        this.fsm.trigger("start");
      });

      it("should set the fsm's current state to be the state we are transitioning to.", function () {
        expect(this.fsm.state).to.equal('state2');
      });

      it("should set the fsm's previous state to be the state we are transitioning away from.", function () {
        expect(this.fsm.previous).to.equal('home');
      });

      it("should cause the fsm to emit a before transition event", function () {
        expect(this.spy.getCall(0).args[0][0]).to.equal('before');
        expect(this.spy.getCall(1).args[0][0]).to.equal('before-start');
      });

      it("should cause the fsm to emit an exit node event for the previous node", function () {
        expect(this.spy.getCall(2).args[0][0]).to.equal('exit');
        expect(this.spy.getCall(3).args[0][0]).to.equal('exit-home');
      });
      
      it("should cause the fsm to emit an enter node event for the current node", function () {
        expect(this.spy.getCall(4).args[0][0]).to.equal('enter');
        expect(this.spy.getCall(5).args[0][0]).to.equal('enter-state2');
      });

      it("should cause the fsm to emit an after transition event", function () {
        expect(this.spy.getCall(6).args[0][0]).to.equal('after');
        expect(this.spy.getCall(7).args[0][0]).to.equal('after-start');
      });

      it("should execute the fsm's onBefore transition event handler", function () {
        expect(this.onBeforeFSMSpy.called).to.equal.true;
      });
      
      it("should execute the fsm's onExit state transition event handler", function () {
        expect(this.onExitFSMSpy.called).to.equal.true;
      });
      it("should execute the fsm's onEnter state event handler", function () {
        expect(this.onEnterFSMSpy.called).to.equal.true;
      });
      it("should execute the fsm's onAfter transition event handler", function () {
        expect(this.onAfterFSMSpy.called).to.equal.true;
      });

      it("should execute any transition-specific onBefore transition event handlers", function () {
        expect(this.onBeforeSpy.called).to.be.true;
      });
      
      it("should execute any state-specific onExit state transition event handlers", function () {
        expect(this.onExitSpy.called).to.be.true;
      });
      
      it("should execute any state-specific onEnter state event handlers", function () {
        expect(this.onEnterSpy.called).to.be.true;
      });
      
      it("should execute any transition-specific onAfter transition event handlers", function () {
        expect(this.onAfterSpy.called).to.be.true;
      });
    });
  });

  describe('#is', function () {
    context('FSM is in the specified state', function () {
      it("should return true", function () {
        var fsm = new FSM(data);
        fsm.start();
        expect(fsm.is('home')).to.be.true;
      });
    });
    context('FSM is not in the specified state', function () {
      it("should return false", function () {
        var fsm = new FSM(data);
        fsm.start();
        expect(fsm.is('state2')).to.be.false;
      });
    });
  });

  describe("#validTrigger", function () {
    context("fsm was started", function () {
      var fsm = new FSM(data);
      fsm.start();

      context("when event name is not specified in any transition event", function () {
        it("should return false", function () {
          expect(fsm.validTrigger('does-not-exit')).to.be.false;
        });
      });

      context("when event name is specified in a transition event", function () {
        context("when the transition's from state is the wildcard", function () {
          it("returns true", function () {
            expect(fsm.validTrigger('reset')).to.be.true;
          });
        });
        context("when the transitions's from state matches the current state", function () {
          it("returns true", function () {
            expect(fsm.validTrigger('start')).to.be.true;
          });
        });
        context("when the transition's from state does not match the current state", function () {
          it("returns false", function () {
            expect(fsm.validTrigger('next')).to.be.false;
          });
        });
      });
    });

    context("fsm was not started", function () {
      var fsm = new FSM(data);

      context("when event name is not specified in any transition event", function () {
        it("should return false", function () {
          expect(fsm.validTrigger('does-not-exit')).to.be.false;
        });
      });

      context("when event name is specified in a transition event", function () {
        context("when the transition's from state is the wildcard", function () {
          it("returns false", function () {
            expect(fsm.validTrigger('reset')).to.be.false;
          });
        });
        context("when the transitions's from state matches the initial state", function () {
          it("returns false", function () {
            expect(fsm.validTrigger('start')).to.be.false;
          });
        });
        context("when the transition's from state does not match the initial state", function () {
          it("returns false", function () {
            expect(fsm.validTrigger('next')).to.be.false;
          });
        });
      });
    });
  });
});