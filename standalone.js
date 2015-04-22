var EventFacade = require('./eventfacade.js');

global.window.EventFacade = EventFacade;

global.window.Fluid = {
  EventFacade: EventFacade,
  Editor: require('./editor.js'),
};
