"use strict";

var EventEmitter = require('events').EventEmitter;

module.exports = function(obj) {
  var facade = Object.create(obj);
  var emitter = new EventEmitter();
  for (var prop in facade) {
    if (typeof facade[prop] === 'function') {
      facade[prop] = facadeFunc(emitter, prop, obj);
    }
  }
  facade.on = emitter.on.bind(emitter);
  facade.once = emitter.once.bind(emitter);  
  return facade;
};

function facadeFunc(emitter, name, obj) {
  return function() {
    var args = Array.prototype.slice.call(arguments);
    emitter.emit.apply(emitter, [name].concat(args));
    obj[name].apply(obj, args);
  };
}
