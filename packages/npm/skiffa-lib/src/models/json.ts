import { StatusCode } from "../utils.js";
import { deserializeTextLines, deserializeTextValue } from "./text.js";

//#region interfaces

export type OutgoingJsonRequest<C extends string, T> = {
  readonly contentType: C;
} & OutgoingJsonContainer<T>;

export type OutgoingJsonResponse<S extends StatusCode, C extends string, T> = {
  readonly status: S;
  readonly contentType: C;
} & OutgoingJsonContainer<T>;

export type IncomingJsonRequest<C extends string, T> = {
  readonly contentType: C;
} & IncomingJsonContainer<T>;

export type IncomingJsonResponse<S extends StatusCode, C extends string, T> = {
  readonly status: S;
  readonly contentType: C;
} & IncomingJsonContainer<T>;

//#endregion

//#region containers

export type OutgoingJsonContainer<T> =
  | { stream(signal?: AbortSignal): AsyncIterable<Uint8Array> }
  | { entity(): Promise<T> }
  | { entities(signal?: AbortSignal): AsyncIterable<T> };

export type IncomingJsonContainer<T> = {
  stream(signal?: AbortSignal): AsyncIterable<Uint8Array>;
} & { entity(): Promise<T> } & {
  entities(signal?: AbortSignal): AsyncIterable<T>;
};

//#endregion

//#region serialization

export async function* serializeJsonEntity(
  asyncEntity: Promise<unknown>,
): AsyncIterable<Uint8Array> {
  const encoder = new TextEncoder();

  const entity = await asyncEntity;
  yield encoder.encode(JSON.stringify(entity));
}

export async function* serializeJsonEntities(
  entities: AsyncIterable<unknown>,
): AsyncIterable<Uint8Array> {
  const encoder = new TextEncoder();

  for await (const entity of entities) {
    yield encoder.encode(JSON.stringify(entity));
    yield encoder.encode("\n");
  }
}

export async function deserializeJsonEntity(
  stream: (signal?: AbortSignal) => AsyncIterable<Uint8Array>,
): Promise<unknown> {
  const text = await deserializeTextValue(stream);

  const trimmed = text.trim();
  const entity = JSON.parse(trimmed);

  return entity;
}

export async function* deserializeJsonEntities(
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

//#endregion
