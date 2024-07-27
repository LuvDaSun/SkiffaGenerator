import { deserializeTextValue } from "./text.js";

export async function* serializeJsonEntity(
  entity: unknown | Promise<unknown>,
): AsyncIterable<Uint8Array> {
  const encoder = new TextEncoder();

  yield encoder.encode(JSON.stringify(await entity));
}

export async function deserializeJsonEntity(
  stream: (signal?: AbortSignal) => AsyncIterable<Uint8Array>,
): Promise<unknown> {
  const text = await deserializeTextValue(stream);

  const trimmed = text.trim();
  const entity = JSON.parse(trimmed);

  return entity;
}
