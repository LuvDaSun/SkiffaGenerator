SHELL:=$(PREFIX)/bin/sh

build: \
	packages/ts/schema-swagger-v2 \
	packages/ts/schema-oas-v3-0 \
	packages/ts/schema-oas-v3-1 \

	npm install

rebuild: \
	clean build

clean: \

	rm --recursive --force packages/ts/schema-swagger-v2 \
	rm --recursive --force packages/ts/schema-oas-v3-0 \
	rm --recursive --force packages/ts/schema-oas-v3-1 \

out/schema-swagger-v2:
	mkdir --parents $(@D)

	npx jns42-generator package http://swagger.io/v2/schema.json\# \
		--package-directory $@ \
		--package-name $(notdir $(basename $@)) \
		--package-version 0.0.0 \

out/schema-oas-v3-0:
	mkdir --parents $(@D)

	npx jns42-generator package https://spec.openapis.org/oas/3.0/schema/2021-09-28 \
		--package-directory $@ \
		--package-name $(notdir $(basename $@)) \
		--package-version 0.0.0 \

out/schema-oas-v3-1:
	mkdir --parents $(@D)

	npx jns42-generator package https://spec.openapis.org/oas/3.1/schema/2022-10-07 \
		--package-directory $@ \
		--package-name $(notdir $(basename $@)) \
		--package-version 0.0.0 \

packages/ts/%: out/%
	mkdir --parents $(@D)

	rm -rf $@
	mv $< $@

	npm install --workspace $@
	npm run clean --workspace $@
	npm run build --workspace $@

.PHONY: \
	build \
	rebuild \
	clean \
