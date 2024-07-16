import { StatusCode } from "../utils.js";
import { deserializeTextValue } from "./text.js";

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
  | { entity(): Promise<T> };

export type IncomingJsonContainer<T> = {
  stream(signal?: AbortSignal): AsyncIterable<Uint8Array>;
} & { entity(): Promise<T> };

//#endregion

//#region serialization

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

//#endregion
