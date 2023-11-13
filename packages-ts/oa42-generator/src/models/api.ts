import * as intermediateB from "@jns42/jns42-schema-intermediate-b";
import { Router } from "goodrouter";
import { Authentication } from "./authentication.js";
import { Path } from "./path.js";

export interface Api {
  uri: URL;
  paths: Array<Path>;
  authentication: Array<Authentication>;
  schemas: Record<string, intermediateB.Node>;
  names: Record<string, string>;
  router: Router<number>;
}
