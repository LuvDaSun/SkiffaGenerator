SHELL:=$(PREFIX)/bin/sh
SRC_TS:=$(wildcard src/*.ts src/*/*.ts src/*/*/*.ts)
OUT_DTS:=$(patsubst src/%.ts,out/%.d.ts,$(SRC_TS))
OUT_JS:=$(patsubst src/%.ts,out/%.js,$(SRC_TS))
OUT_JS_MAP:=$(patsubst src/%.ts,out/%.js.map,$(SRC_TS))
OUT_CJS:=$(patsubst src/%.ts,out/%.cjs,$(SRC_TS))
OUT_CJS_MAP:=$(patsubst src/%.ts,out/%.cjs.map,$(SRC_TS))

build: \
	$(OUT_DTS) \
	$(OUT_JS) \
	$(OUT_JS_MAP) \
	$(OUT_CJS) \
	$(OUT_CJS_MAP) \

rebuild: \
	clean build

clean: \

	rm --recursive --force out

out/%.js out/%.js.map out/%.d.ts: \
	tsconfig.json \
	src/%.ts \

	npx tsc \
		--project $< \
		--composite false \

out/%.cjs: \
	.cjs/%.js \

	@mkdir --parents $(@D)
	@mv $< $@

out/%.cjs.map: \
	.cjs/%.js.map \

	@mkdir --parents $(@D)
	@mv $< $@	

.cjs/%.js .cjs/%.js.map: \
	tsconfig.json \
	src/%.ts \

	npx tsc \
		--project $< \
		--composite false \
		--outDir .cjs \
		--declaration false \
		--module commonjs \
		--moduleResolution Node10 \

.PHONY: \
	build \
	rebuild \
	clean \

.NOTPARALLEL: \
	clean build \
	$(OUT_JS) \
	$(OUT_DTS) \
