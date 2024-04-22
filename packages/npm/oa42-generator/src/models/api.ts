import { NodeLocation } from "@jns42/core";
import { Router } from "goodrouter";
import { Authentication } from "./authentication.js";
import { Path } from "./path.js";

export interface Api {
  location: NodeLocation;
  paths: Array<Path>;
  authentication: Array<Authentication>;
  router: Router<number>;
  names: Record<string, string>;
}
