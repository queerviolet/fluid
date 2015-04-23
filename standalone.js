var EventFacade = require('./src/eventfacade.js');

global.window.Fluid = {
  EventFacade: EventFacade,
  Editor: require('./src/editor.js'),
};
