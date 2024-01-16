SHELL:=$(PREFIX)/bin/sh

rebuild: \
	clean build

clean: \

	rm --recursive --force packages/ts/schema-swagger-v2 \
	rm --recursive --force packages/ts/schema-oas-v3-0 \
	rm --recursive --force packages/ts/schema-oas-v3-1 \

build: \
	packages/ts/schema-swagger-v2 \
	packages/ts/schema-oas-v3-0 \
	packages/ts/schema-oas-v3-1 \

	npm install

out/schema-swagger-v2:
	npx --yes jns42-generator package http://swagger.io/v2/schema.json\# \
		--package-directory $@ \
		--package-name $(notdir $(basename $@)) \

out/schema-oas-v3-0:
	npx --yes jns42-generator package https://spec.openapis.org/oas/3.0/schema/2021-09-28 \
		--package-directory $@ \
		--package-name $(notdir $(basename $@)) \

out/schema-oas-v3-1:
	npx --yes jns42-generator package https://spec.openapis.org/oas/3.1/schema/2022-10-07 \
		--package-directory $@ \
		--package-name $(notdir $(basename $@)) \

packages/ts/%: out/%
	rm -rf $@
	mv $< $@

	npm install --workspace $(notdir $(basename $@))
	npm run build --workspace $(notdir $(basename $@))

.PHONY: \
	build \
	rebuild \
	clean \
