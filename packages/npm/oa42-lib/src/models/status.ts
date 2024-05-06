import { UnexpectedStatusCode } from "../main.js";
import { StatusCode } from "../utils/index.js";

export type StatusContainer<T extends StatusCode = StatusCode> = {
  status: T;
};

export function expectStatus<T extends StatusCode>(
  actualContainer: StatusContainer,
  ...expected: T[]
): asserts actualContainer is StatusContainer<T> {
  for (const status of expected) {
    if (actualContainer.status === status) {
      return;
    }
  }

  throw new UnexpectedStatusCode(actualContainer.status);
}
