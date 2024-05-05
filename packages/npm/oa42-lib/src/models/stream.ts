import { StatusCode } from "../utils/index.js";
import { ParametersContainer } from "./parameters.js";

//#region interfaces

export type OutgoingStreamRequestDefault<P extends object> = ParametersContainer<P> &
  OutgoingStreamContainer;

export type OutgoingStreamRequest<P extends object, C extends string> = ParametersContainer<P> &
  OutgoingStreamContainer & {
    readonly contentType: C;
  };

export type OutgoingStreamResponseDefault<
  S extends StatusCode,
  P extends object,
> = ParametersContainer<P> &
  OutgoingStreamContainer & {
    readonly status: S;
  };

export type OutgoingStreamResponse<
  S extends StatusCode,
  P extends object,
  C extends string,
> = ParametersContainer<P> &
  OutgoingStreamContainer & {
    readonly status: S;
    readonly contentType: C;
  };

export type IncomingStreamRequest<P extends object, C extends string> = ParametersContainer<P> &
  IncomingStreamContainer & {
    readonly contentType: C;
  };

export type IncomingStreamResponse<
  S extends StatusCode,
  P extends object,
  C extends string,
> = ParametersContainer<P> &
  IncomingStreamContainer & {
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
