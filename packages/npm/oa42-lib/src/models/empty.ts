import { StatusCode } from "../utils/index.js";
import { ParametersContainer } from "./parameters.js";

export type OutgoingEmptyRequestDefault<P extends object> = ParametersContainer<P>;

export type OutgoingEmptyRequest<P extends object> = ParametersContainer<P> & {
  readonly contentType: null;
};

export type OutgoingEmptyResponseDefault<
  S extends StatusCode,
  P extends object,
> = ParametersContainer<P> & {
  readonly status: S;
};

export type OutgoingEmptyResponse<
  S extends StatusCode,
  P extends object,
> = ParametersContainer<P> & {
  readonly status: S;
  readonly contentType: null;
};

export type IncomingEmptyRequest<P extends object> = ParametersContainer<P> & {
  readonly contentType: null;
};

export type IncomingEmptyResponse<
  S extends StatusCode,
  P extends object,
> = ParametersContainer<P> & {
  readonly status: S;
  readonly contentType: null;
};
