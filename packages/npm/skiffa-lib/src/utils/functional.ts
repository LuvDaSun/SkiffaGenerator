export async function* mapAsyncIterable<T, R>(
  iterable: Iterable<T> | AsyncIterable<T>,
  mapper: (value: T) => R,
): AsyncIterable<R> {
  for await (const value of iterable) {
    yield mapper(value);
  }
}

export function first<T>(iterable: Iterable<T>): T | undefined {
  for (const item of iterable) {
    return item;
  }
  return undefined;
}

export function* intersect<T>(iterable: Iterable<T>, otherIterable: Iterable<T>) {
  const otherSet = new Set(otherIterable);
  for (const element of iterable) {
    if (!otherSet.has(element)) {
      continue;
    }
    yield element;
  }
}
