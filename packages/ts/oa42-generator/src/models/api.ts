import { Router } from "goodrouter";
import { Specification } from "jns42-generator/out/models/specification.js";
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
