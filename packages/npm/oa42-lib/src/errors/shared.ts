import { StatusCode } from "../utils/index.js";
import { ErrorBase } from "./base.js";

export class Unreachable extends ErrorBase {
  public readonly name = "Unreachable";

  constructor() {
    super(`Unreachable`);
  }
}

export class UnexpectedStatusCode extends ErrorBase {
  public readonly name = "UnexpectedStatusCode";

  constructor(public readonly status: StatusCode) {
    super(`UnexpectedStatusCode ${status}`);
  }
}
