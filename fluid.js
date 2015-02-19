"use strict";

var Fluid = (function() {
  var editor = Object.create(HTMLElement.prototype);

  editor.createdCallback = function() {
    var self = this;
    this.cm = CodeMirror(this, {
      mode: 'javascript',
      gutters: ['console'],
      extraKeys: {
        'Ctrl-Enter': function() {
          self.run();
        }
      },
    });

    this.cm.setValue("console.log('hello world');");
    this.console = EventEmitter.facade(window.console);
    this.console.on(this.log, this);
  };

  editor.run = function() {
    var src = this.cm.getValue();
    var console = this.console;
    this.clear();
    eval(src);
  };
 
  editor.log = function(prop) {
    var pos = getEvalPos();
    var widget = this.getMsgElement(pos);
    var args = Array.prototype.slice.call(arguments, 1);
    widget.node.textContent = args.join(' ');
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

  var stackRe = /<anonymous>:(\d+):(\d+)/;
  var getEvalPos = function() {
    // at fluid-editor.eval (eval at <anonymous> (file:///Users/ashi/fluid/fluid.js:19:10), <anonymous>:1:9)
    var st = new Error().stack;
    var match = st.match(stackRe);
    if (match) {
      return {
        line: match[1],
        ch: match[2],
      };
    }
    return null;
  };

  var Editor = document.registerElement('fluid-editor', { prototype: editor });
  return { Editor: Editor };
})();