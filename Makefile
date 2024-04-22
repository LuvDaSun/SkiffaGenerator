SHELL:=$(PREFIX)/bin/sh

build: \
	packages/npm/oa42-core/bin/main.wasm \

rebuild: \
	clean build

clean: \

	rm -f packages/npm/oa42-core/bin/main.wasm
	rm -rf generated
	rm -rf target

target/wasm32-unknown-unknown/release/oa42_core.wasm: \
	packages/cargo/oa42-core \
	$(wildcard packages/cargo/oa42-core/Cargo.toml) \
	$(wildcard packages/cargo/oa42-core/src/*.rs) \
	$(wildcard packages/cargo/oa42-core/src/*/*.rs) \
	$(wildcard packages/cargo/oa42-core/src/*/*/*.rs) \
	Cargo.lock \

	cargo \
		build \
		--package oa42-core \
		--target wasm32-unknown-unknown \
		--release \

packages/npm/oa42-core/bin/main.wasm: \
	target/wasm32-unknown-unknown/release/oa42_core.wasm \

	@mkdir -p $(@D)
	cp $< $@


.PHONY: \
	build \
	rebuild \
	clean \
