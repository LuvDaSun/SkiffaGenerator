export function wrapAsync<A extends unknown[], R>(
  inner: (...args: A) => Promise<R>,
  wrapper: (inner: () => Promise<R>) => Promise<R>,
): (...args: A) => Promise<R> {
  return (...args: A) => {
    return wrapper(async () => {
      return await inner(...args);
    });
  };
}
