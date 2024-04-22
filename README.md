# OpenApi42

Because OpenApi is the answer to everything!

## Installing

First, install dependencies via `npm install`. Tests should work on node v21 and later!

## Building

You probably want to build The project via `npm --workspaces run build`. This is automatically done before testing and packaging.

> instead of using `--workspaces` you can also use `-ws` we will be using the full names as they make more clear what they are doing.

## Publishing

Bump version via `npm --workspaces version patch`. You could also bump a minor or major version.

Then update dependencies via `npm --workspaces update --save`, or do this manually.

The publish everything via `npm --workspaces publish`.

Then commit and push everything to git.
