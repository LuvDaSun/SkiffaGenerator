import { StatusCode } from "../utils.js";

//#region interfaces

export type OutgoingStreamRequest<C extends string> = OutgoingStreamContainer & {
  readonly contentType: C;
};

export type OutgoingStreamResponse<
  S extends StatusCode,
  C extends string,
> = OutgoingStreamContainer & {
  readonly status: S;
  readonly contentType: C;
};

export type IncomingStreamRequest<C extends string> = IncomingStreamContainer & {
  readonly contentType: C;
};

export type IncomingStreamResponse<
  S extends StatusCode,
  C extends string,
> = IncomingStreamContainer & {
  readonly status: S;
  readonly contentType: C;
};

//#endregion

//#region containers

export type OutgoingStreamContainer = {
  stream(signal?: AbortSignal): AsyncIterable<Uint8Array>;
};

export type IncomingStreamContainer = {
  stream(signal?: AbortSignal): AsyncIterable<Uint8Array>;
};

//#endregion
