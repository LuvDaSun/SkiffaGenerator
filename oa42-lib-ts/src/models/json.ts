import { Promisable } from "type-fest";
import { StatusCode } from "../utils/index.js";
import { deserializeTextLines, deserializeTextValue } from "./text.js";

//#region interfaces

export type OutgoingJsonRequestDefault<P extends object, T> = {
  readonly parameters: P;
} & OutgoingJsonContainer<T>;

export type OutgoingJsonRequest<P extends object, C extends string, T> = {
  readonly parameters: P;
  readonly contentType: C;
} & OutgoingJsonContainer<T>;

export type OutgoingJsonResponseDefault<
  S extends StatusCode,
  P extends object,
  T,
> = {
  readonly status: S;
  readonly parameters: P;
} & OutgoingJsonContainer<T>;

export type OutgoingJsonResponse<
  S extends StatusCode,
  P extends object,
  C extends string,
  T,
> = {
  readonly status: S;
  readonly parameters: P;
  readonly contentType: C;
} & OutgoingJsonContainer<T>;

export type IncomingJsonRequest<P extends object, C extends string, T> = {
  readonly parameters: P;
  readonly contentType: C;
} & IncomingJsonContainer<T>;

export type IncomingJsonResponse<
  S extends StatusCode,
  P extends object,
  C extends string,
  T,
> = {
  readonly status: S;
  readonly parameters: P;
  readonly contentType: C;
} & IncomingJsonContainer<T>;

//#endregion

//#region containers

export type OutgoingJsonContainer<T> =
  | { stream(signal?: AbortSignal): AsyncIterable<Uint8Array> }
  | { entity(): Promisable<T> }
  | { entities(signal?: AbortSignal): AsyncIterable<T> };

export type IncomingJsonContainer<T> = {
  stream(signal?: AbortSignal): AsyncIterable<Uint8Array>;
} & { entity(): Promisable<T> } & {
  entities(signal?: AbortSignal): AsyncIterable<T>;
};

//#endregion

//#region serialization

export async function* serializeJsonEntity(
  asyncEntity: Promisable<unknown>,
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
