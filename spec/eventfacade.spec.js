"use strict";

describe('an EventFacade', function() {
  var original = {
    yell: function() { },
    cry: function() { },
    tears: 2,
  };
  var facade;
  beforeAll(function() {
    spyOn(original, 'yell');
    spyOn(original, 'cry');
    facade = EventFacade(original);
  });

  it('calls through', function() {
    facade.yell(2, 3, 4);
    facade.cry('x', 'y', 'z');
    expect(original.yell).toHaveBeenCalledWith(2, 3, 4);
    expect(original.cry).toHaveBeenCalledWith('x', 'y', 'z');
  });

  it('has on and once methods', function() {
    expect(facade.on).toEqual(jasmine.any(Function));
    expect(facade.once).toEqual(jasmine.any(Function));
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
