SHELL:=$(PREFIX)/bin/sh
SRC_TS:=$(wildcard src/*.ts src/*/*.ts src/*/*/*.ts)
TYPES_DTS:=$(patsubst src/%.ts,types/%.d.ts,$(SRC_TS))
TRANSPILED_JS:=$(patsubst src/%.ts,transpiled/%.js,$(SRC_TS))
TRANSPILED_JS_MAP:=$(patsubst src/%.ts,transpiled/%.js.map,$(SRC_TS))

build: \
	$(TYPES_DTS) \
	$(TRANSPILED_JS) \
	$(TRANSPILED_JS_MAP) \
	bundled/browser.js \
	bundled/main.js \
	bundled/main.cjs \

rebuild: \
	clean build

clean: \

	rm --recursive --force bundled transpiled types

transpiled/%.js transpiled/%.js.map types/%.d.ts: \
	tsconfig.json \
	src/%.ts \

	npx tsc \
		--project $< \

bundled/%.js bundled/%.js.map: \
	transpiled/%.js \
	$(TRANSPILED_JS) \
	$(TRANSPILED_JS_MAP) \

	npx rollup \
		--input $< \
		--file bundled/$*.js \
		--sourcemap \
		--format es \

bundled/%.cjs bundled/%.cjs.map: \
	transpiled/%.js \
	$(TRANSPILED_JS) \
	$(TRANSPILED_JS_MAP) \

	npx rollup \
		--input $< \
		--file bundled/$*.cjs \
		--sourcemap \
		--format cjs \

.PHONY: \
	build \
	rebuild \
	clean \

.NOTPARALLEL: \
	clean build rebuild \
	transpiled/%.js transpiled/%.js.map types/%.d.ts \
	bundled/%.cjs bundled/%.cjs.map \
