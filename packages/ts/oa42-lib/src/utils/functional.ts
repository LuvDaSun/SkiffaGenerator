import { Promisable } from "type-fest";

export async function* mapAsyncIterable<T, R>(
  iterable: Iterable<T> | AsyncIterable<T>,
  mapper: (value: T) => R,
): AsyncIterable<R> {
  for await (const value of iterable) {
    yield mapper(value);
  }
}

export async function mapPromisable<T, R>(
  promisable: Promisable<T>,
  mapper: (value: T) => R,
): Promise<R> {
  const value = await promisable;
  return mapper(value);
}

export function first<T>(iterable: Iterable<T>): T | undefined {
  for (const item of iterable) {
    return item;
  }
  return undefined;
}
