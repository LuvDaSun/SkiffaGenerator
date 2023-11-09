import { StatusCode } from "../utils/index.js";

//#region interfaces

export interface OutgoingStreamRequestDefault<P extends object> {
  readonly parameters: P;
  stream(signal?: AbortSignal): AsyncIterable<Uint8Array>;
}

export interface OutgoingStreamRequest<P extends object, C extends string> {
  readonly parameters: P;
  readonly contentType: C;
  stream(signal?: AbortSignal): AsyncIterable<Uint8Array>;
}

export interface OutgoingStreamResponseDefault<
  S extends StatusCode,
  P extends object,
> {
  readonly status: S;
  readonly parameters: P;
  stream(signal?: AbortSignal): AsyncIterable<Uint8Array>;
}

export interface OutgoingStreamResponse<
  S extends StatusCode,
  P extends object,
  C extends string,
> {
  readonly status: S;
  readonly parameters: P;
  readonly contentType: C;
  stream(signal?: AbortSignal): AsyncIterable<Uint8Array>;
}

export interface IncomingStreamRequest<P extends object, C extends string> {
  readonly parameters: P;
  readonly contentType: C;
  stream(signal?: AbortSignal): AsyncIterable<Uint8Array>;
}

export interface IncomingStreamResponse<
  S extends StatusCode,
  P extends object,
  C extends string,
> {
  readonly status: S;
  readonly parameters: P;
  readonly contentType: C;
  stream(signal?: AbortSignal): AsyncIterable<Uint8Array>;
}

//#endregion

//#region containers

export type OutgoingStreamContainer = {
  stream(signal?: AbortSignal): AsyncIterable<Uint8Array>;
};

export type IncomingStreamContainer = {
  stream(signal?: AbortSignal): AsyncIterable<Uint8Array>;
};

//#endregion
