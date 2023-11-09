import { StatusCode } from "../utils/index.js";

export interface OutgoingEmptyRequestDefault<P extends object> {
  readonly parameters: P;
}

export interface OutgoingEmptyRequest<P extends object> {
  readonly parameters: P;
  readonly contentType: null;
}

export interface OutgoingEmptyResponseDefault<
  S extends StatusCode,
  P extends object,
> {
  readonly status: S;
  readonly parameters: P;
}

export interface OutgoingEmptyResponse<S extends StatusCode, P extends object> {
  readonly status: S;
  readonly parameters: P;
  readonly contentType: null;
}

export interface IncomingEmptyRequest<P extends object> {
  readonly parameters: P;
  readonly contentType: null;
}

export interface IncomingEmptyResponse<S extends StatusCode, P extends object> {
  readonly status: S;
  readonly parameters: P;
  readonly contentType: null;
}
