import { UnexpectedStatusCode } from "../errors/index.js";
import { StatusCode } from "../utils/index.js";

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
