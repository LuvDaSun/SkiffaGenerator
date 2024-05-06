import { UnexpectedStatusCode } from "../main.js";

export type StatusContainer<T extends number = number> = {
  status: T;
};

export function expectStatus<T extends number>(
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
