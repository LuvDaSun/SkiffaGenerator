import { Router } from "goodrouter";
import * as jns42generator from "jns42-generator";
import { Authentication } from "./authentication.js";
import { Path } from "./path.js";

export interface Api {
  uri: URL;
  paths: Array<Path>;
  authentication: Array<Authentication>;
  schemas: Record<string, any>;
  names: Record<string, string>;
  router: Router<number>;
  types: Record<string, jns42generator.Item | jns42generator.Alias>;
}
