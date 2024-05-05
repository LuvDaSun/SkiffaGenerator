import { StatusCode } from "../utils/index.js";

export type OutgoingEmptyRequest = {
  readonly contentType: null;
};

export type OutgoingEmptyResponse<S extends StatusCode> = {
  readonly status: S;
  readonly contentType: null;
};

export type IncomingEmptyRequest = {
  readonly contentType: null;
};

export type IncomingEmptyResponse<S extends StatusCode> = {
  readonly status: S;
  readonly contentType: null;
};
