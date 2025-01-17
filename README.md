# Skiffa

With love from [Scheveningen](https://www.youtube.com/live/DaG5JReOYEw?si=Jbe5P41pGgW92AZO)!

We love our early bird sponsors!

[<img src="assets/nawadi.svg" alt="Nationaal Watersportdiploma" width="100" />](https://www.nationaalwatersportdiploma.nl/)
[<img src="assets/prospero.png" alt="Prospero" width="100" />](https://prosperoapp.com/)
[<img src="assets/token-me.png" alt="TokenMe" width="100" />](https://token-me.com/)

## Installing

First, install dependencies via `npm install`.

## Building

You probably want to build The project via `npm --workspaces run build`. This is automatically done before testing and packaging.

> instead of using `--workspaces` you can also use `-ws` we will be using the full names as they make more clear what they are doing.

## Testing

Tests should work on node v21 and later! Run all tests via `npm --workspaces test`.

## Publishing

Bump version via `npm --workspaces version patch`. You could also bump a minor or major version.

Then update dependencies via `npm --workspaces update --save`, or do this manually.

The publish everything via `npm --workspaces publish`.

Then commit and push everything to git.
