import { deserializeTextLines } from "./text.js";

export async function* serializeNdjsonEntities(
  entities: AsyncIterable<unknown>,
): AsyncIterable<Uint8Array> {
  const encoder = new TextEncoder();

  for await (const entity of entities) {
    yield encoder.encode(JSON.stringify(entity));
    yield encoder.encode("\n");
  }
}

export async function* deserializeNdjsonEntities(
  stream: (signal?: AbortSignal) => AsyncIterable<Uint8Array>,
  signal?: AbortSignal,
): AsyncIterable<unknown> {
  const lines = deserializeTextLines(stream, signal);

  for await (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const entity = JSON.parse(trimmed);

    yield entity;
  }
}
