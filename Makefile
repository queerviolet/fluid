all: prep standalone.js
	browserify standalone.js --standalone fluid > dist/fluid.js

clean:
	rm -rf dist

prep:
	mkdir -p dist

.PHONY: all clean prep