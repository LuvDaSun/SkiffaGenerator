import { Router } from "goodrouter";
import * as jns42generator from "jns42-generator";
import { Authentication } from "./authentication.js";
import { Path } from "./path.js";

export interface Api {
  uri: URL;
  paths: Array<Path>;
  authentication: Array<Authentication>;
  router: Router<number>;
  names: jns42generator.Specification["names"];
}
