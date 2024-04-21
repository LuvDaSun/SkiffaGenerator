import { Router } from "goodrouter";
import { Authentication } from "./authentication.js";
import { Path } from "./path.js";

export interface Api {
  location: string;
  paths: Array<Path>;
  authentication: Array<Authentication>;
  router: Router<number>;
  names: Record<string, string>;
}
