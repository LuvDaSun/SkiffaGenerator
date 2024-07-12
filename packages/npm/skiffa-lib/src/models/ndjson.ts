import { StatusCode } from "../utils.js";
import { deserializeTextLines } from "./text.js";

//#region interfaces

export type OutgoingNdjsonRequest<C extends string, T> = {
  readonly contentType: C;
} & OutgoingNdjsonContainer<T>;

export type OutgoingNdjsonResponse<S extends StatusCode, C extends string, T> = {
  readonly status: S;
  readonly contentType: C;
} & OutgoingNdjsonContainer<T>;

export type IncomingNdjsonRequest<C extends string, T> = {
  readonly contentType: C;
} & IncomingNdjsonContainer<T>;

export type IncomingNdjsonResponse<S extends StatusCode, C extends string, T> = {
  readonly status: S;
  readonly contentType: C;
} & IncomingNdjsonContainer<T>;

//#endregion

//#region containers

export type OutgoingNdjsonContainer<T> =
  | { stream(signal?: AbortSignal): AsyncIterable<Uint8Array> }
  | { entities(signal?: AbortSignal): AsyncIterable<T> };

export type IncomingNdjsonContainer<T> = {
  stream(signal?: AbortSignal): AsyncIterable<Uint8Array>;
} & {
  entities(signal?: AbortSignal): AsyncIterable<T>;
};

//#endregion

//#region serialization

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

//#endregion
