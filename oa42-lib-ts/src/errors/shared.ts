import { ErrorBase } from "./base.js";

export class Unreachable extends ErrorBase {
  public readonly name = "Unreachable";

  constructor() {
    super(`Unreachable`);
  }
}
