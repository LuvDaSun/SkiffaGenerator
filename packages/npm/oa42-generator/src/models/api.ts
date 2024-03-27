import { Router } from "goodrouter";
import { NodeLocation } from "jns42-generator";
import { Authentication } from "./authentication.js";
import { Path } from "./path.js";

export interface Api {
  location: NodeLocation;
  paths: Array<Path>;
  authentication: Array<Authentication>;
  router: Router<number>;
  names: Record<string, string>;
}
