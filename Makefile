BROWSERIFY=browserify -t browserify-css

all: prep dist debug spec

dist: standalone.js
	$(BROWSERIFY) standalone.js --standalone fluid > dist/fluid.js

debug: standalone.js
	$(BROWSERIFY) -d standalone.js --standalone fluid > dist/fluid.debug.js

spec: spec/*.js
	$(BROWSERIFY) -d spec/*.js --standalone fluid-specs > .spec.js

clean:
	rm -rf dist

prep:
	mkdir -p dist

.PHONY: all dist clean prep