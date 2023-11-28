import { Specification } from "generator/out/models/specification.js";
import { Router } from "goodrouter";
import { Authentication } from "./authentication.js";
import { Path } from "./path.js";

export interface Api {
  uri: URL;
  paths: Array<Path>;
  authentication: Array<Authentication>;
  schemas: Specification["nodes"];
  names: Record<string, string>;
  router: Router<number>;
}
