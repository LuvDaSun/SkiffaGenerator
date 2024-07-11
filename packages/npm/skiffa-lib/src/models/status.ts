import { UnexpectedStatusCode } from "../errors.js";
import { StatusCode } from "../utils.js";

export type StatusContainer<S extends StatusCode> = {
  status: S;
};

export function expectStatus<T extends StatusCode>(
  actualContainer: StatusContainer<StatusCode>,
  ...expected: T[]
): asserts actualContainer is StatusContainer<T> {
  for (const status of expected) {
    if (actualContainer.status === status) {
      return;
    }
  }

  throw new UnexpectedStatusCode(actualContainer.status);
}
