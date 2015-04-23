"use strict";

require('codemirror/mode/javascript/javascript');
var CodeMirror = require('codemirror/lib/codemirror');
var StackTrace = require('stack-trace');
var facade = require('./eventfacade.js');

var css = require('./editor.css');

var editor = Object.create(HTMLElement.prototype);

editor.createdCallback = function() {
  this.log = this.msg.bind(this, 'log');
  this.error = this.msg.bind(this, 'error');

  var self = this;

  this.cm = CodeMirror(this, {
    mode: 'javascript',
    gutters: ['console'],
    lineNumbers: true,
    extraKeys: {
      'Ctrl-Enter': function() {
        self.run();
      }
    },
  });

  this.console = facade(window.console);
  this.console.on('log', this.log);
  this.console.on('error', this.error);
};

editor.run = function() {
  var src = this.cm.getValue();
  var console = this.console;
  this.clear();
  eval(src);
};

editor.msg = function(kind) {
  var pos = getEvalPos();
  var widget = this.getMsgElement(pos);
  var args = Array.prototype.slice.call(arguments, 1);
  widget.node.textContent = args.join(' ');
  widget.node.classList.add(kind);
};

editor.getMsgElement = function(pos) {
  var line = pos.line - 1;
  if (this.widgets[line] === undefined) {
    var msg = document.createElement('fluid-con-msg');
    this.widgets[line] = this.cm.addLineWidget(line, msg);
  }
  return this.widgets[line];
};

// unused
editor.getMsgElementGutterMark = function(pos) {
  if (this.marks[pos.line] === undefined) {
    var mark = document.createElement('fluid-con-msg');
    this.marks[pos.line] = mark;
    var handle = this.cm.setGutterMarker(pos.line - 1, 'console', mark);
  } else {
    mark = this.marks[pos.line];
  }
  return {node: mark};
};

editor.clear = function() {
  this.cm.clearGutter('console');
  this.marks = [];
  if (this.widgets) {
    for (var line in this.widgets) {
      this.widgets[line].clear();
    }
  }
  this.widgets = {};    
};

function getEvalPos() {
  var st = StackTrace.get();
  for (var i = 0; i != st.length; ++i) {
    if (st[i].isEval()) {
      return {
        line: st[i].getLineNumber(),
        ch: st[i].getColumnNumber()
      };
    }
  }
  return null;
};

module.exports = document.registerElement('fluid-editor', { prototype: editor });