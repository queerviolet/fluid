all: prep dist debug

dist: standalone.js
	browserify standalone.js --standalone fluid > dist/fluid.js

debug: standalone.js
	browserify -d standalone.js --standalone fluid > dist/fluid-debug.js

clean:
	rm -rf dist

prep:
	mkdir -p dist

.PHONY: all dist clean prep