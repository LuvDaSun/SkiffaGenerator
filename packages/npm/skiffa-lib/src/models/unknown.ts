import { StatusCode } from "../utils.js";

export type OutgoingUnknownResponse<S extends StatusCode> = {
  readonly status: S;
};

export type IncomingUnknownResponse<S extends StatusCode> = {
  readonly status: S;
};
