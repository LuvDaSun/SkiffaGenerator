import { NodeLocation } from "@oa42/core";
import { Router } from "goodrouter";
import { Authentication } from "./authentication.js";

export interface Api {
  location: NodeLocation;
  // paths: Array<Path>;
  authentication: Array<Authentication>;
  router: Router<number>;
  names: Record<string, string>;
}
