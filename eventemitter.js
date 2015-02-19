"use strict";

var EventEmitter = (function() {
  var Listener = function(func, context) {
    this.func = func;
    this.context = context;    
  };

  Listener.prototype.fire = function(args) {
    try {
      this.func.apply(this.context, args);
    } catch(e) {
      console.error(e);
    }
  };

  var Emitter = function() {
    this.listeners = {};
    this.catchalls = [];
  };

  Emitter.prototype.on = function(channel, func, context) {
    if (typeof channel === 'function') {
      // shift args
      this.catchalls.push(new Listener(channel, func));
      return;
    }
    this.listeners[channel] = this.listeners[channel] || [];
    this.listeners[channel].push(new Listener(func, context));
  };

  Emitter.prototype.off = function(channel, func, context) {
    if (typeof channel === 'function') {
      // shift args
      return removeCatchall(this, channel, func);
    }

    var listeners = this.listeners[channel];
    if (!listeners) return;

    var i = listeners.length;
    while (--i >= 0) {
      if (listeners[i].func === func &&
          listeners[i].context === context) {
        return listeners.splice(i, 1)[0];
      }
    }

    if (listeners.length === 0) {
      delete this.listeners[channel];
    }
  };

  function removeCatchall(emitter, func, context) {
    var i = emitter.catchalls.length;
    while(--i >= 0) {
      if (emitter.catchalls[i].func === func &&
          emitter.catchalls[i].context === context) {
        return emitter.catchalls.splice(i, 1)[0];
      }
    }
  }

  Emitter.prototype.emit = function(channel) {
    var listeners = this.listeners[channel];
    if (!listeners && this.catchalls.length == 0) return;
    var evt = Array.prototype.slice.call(arguments, 1);

    if (listeners) {
      var i = listeners.length;
      while (--i >= 0) {
        listeners[i].fire(evt);
      }
    }

    if (this.catchalls.length > 0) {
      var chanAndEvent = [channel].concat(evt);
      i = this.catchalls.length;
      while (--i >= 0) {
        this.catchalls[i].fire(chanAndEvent);
      }
    }
  };

  Emitter.facade = function(obj) {
    var facade = Object.create(obj);
    var emitter = new EventEmitter();
    for (var prop in facade) {
      if (typeof facade[prop] === 'function') {
        facade[prop] = facadeFunc(emitter, prop, obj);
      }
    }
    facade.on = emitter.on.bind(emitter);
    facade.off = emitter.off.bind(emitter);
    return facade;
  };

  function facadeFunc(emitter, name, obj) {
    return function() {
      var args = Array.prototype.slice.call(arguments);
      emitter.emit.apply(emitter, [name].concat(args));
      obj[name].apply(obj, args);
    };
  }

  return Emitter;
})();

if (window.jasmine) {
  describe('an EventEmitter', function() {
    var emitter;
    beforeEach(function() {
      emitter = new EventEmitter();
    });

    it('has on, off, and emit methods', function() {
      expect(emitter.on).toEqual(jasmine.any(Function));
      expect(emitter.off).toEqual(jasmine.any(Function));
      expect(emitter.emit).toEqual(jasmine.any(Function));
    });

    it('sends events to listeners added with on', function() {
      var chan = 'channel';
      var ctx = 'some object';
      var heard, withContext;
      emitter.on(chan, function(event) {
        heard = event;
        withContext = this;
      }, ctx);
      var evt = 'screaming';
      emitter.emit(chan, evt, ctx);
      expect(heard).toBe('screaming');
      expect(withContext).toBe(ctx);
    });

    it('sends events to multiple listeners', function() {
      var chan = 'channel';      
      var heard1, heard2;
      emitter.on(chan, function(event) {
        heard1 = event;
      });
      emitter.on(chan, function(event) {
        heard2 = event;
      });
      var evt = 'screaming';
      emitter.emit(chan, evt);
      expect(heard1).toBe(evt);
      expect(heard2).toBe(evt);
    });

    it('swallows events for which there are no listeners', function() {
      emitter.emit('channel', 'screaming into the void');
      expect(true).toBe(true); // Just checking for no errors.
    });

    it('throws exceptions to the console and keeps going', function() {
      spyOn(console, 'error').and.callThrough();
      var chan = 'channel';      
      var heard1, heard2;
      var error = new Error('ahhhhhhh');
      emitter.on(chan, function(event) {
        heard1 = event;
      });
      emitter.on(chan, function(event) {
        throw error;
      });
      emitter.on(chan, function(event) {
        heard2 = event;
      });
      var evt = 'screaming';
      emitter.emit(chan, evt);
      expect(heard1).toBe(evt);
      expect(heard2).toBe(evt);
      expect(console.error).toHaveBeenCalledWith(error);
    });

    it('can remove event listeners with off', function() {
      var chan = 'channel';
      var fired = false;
      var listener = function() {
        fired = true;
      };
      emitter.on(chan, listener);
      emitter.off(chan, listener);
      emitter.emit(chan, 'vague noises');
      expect(fired).toBe(false);
    });

    it('can add catchall listeners', function() {
      var chan = 'channel';
      var evt = 'screaming';
      var fired = false;
      emitter.on(function(channel, event) {
        fired = true;
        expect(channel).toBe(chan);
        expect(event).toBe(evt);
      })
      emitter.emit(chan, evt);
      expect(fired).toBe(true);
    });

    it('can remove catchall listeners', function() {
      var chan = 'channel';
      var evt = 'screaming';
      var fired = false;
      var func = function(channel, event) {
        fired = true;
      };
      emitter.on(func);
      emitter.off(func);
      emitter.emit(chan, evt);
      expect(fired).toBe(false);
    });


    describe('can construct facades', function() {
      var original = {
        yell: function() { },
        cry: function() { },
        tears: 2,
      };
      var facade;
      beforeAll(function() {
        spyOn(original, 'yell');
        spyOn(original, 'cry');
        facade = EventEmitter.facade(original);
      });

      it('which call through', function() {
        facade.yell(2, 3, 4);
        facade.cry('x', 'y', 'z');
        expect(original.yell).toHaveBeenCalledWith(2, 3, 4);
        expect(original.cry).toHaveBeenCalledWith('x', 'y', 'z');
      });

      it('which have on and off methods', function() {
        expect(facade.on).toEqual(jasmine.any(Function));
        expect(facade.off).toEqual(jasmine.any(Function));
      });

      it('which emit events on method calls', function() {
        var yelled;
        facade.on('yell', function(a, b, c) {
          yelled = true;
          expect(a).toBe(2);
          expect(b).toBe(3);
          expect(c).toBe(4);
        });
        var cried;
        facade.on('cry', function(x, y, z) {
          cried = true;
          expect(x).toBe('x');
          expect(y).toBe('y');
          expect(z).toBe('z');
        });
        facade.yell(2, 3, 4);
        facade.cry('x', 'y', 'z');
        expect(yelled).toBe(true);
        expect(cried).toBe(true);
      });
    });
  });
}