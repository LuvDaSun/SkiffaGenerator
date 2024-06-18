import { Router } from "goodrouter";

export interface Api {
  // location: string;
  // paths: Array<Path>;
  // authentication: Array<Authentication>;
  router: Router<number>;
  names: Record<string, string>;
}
