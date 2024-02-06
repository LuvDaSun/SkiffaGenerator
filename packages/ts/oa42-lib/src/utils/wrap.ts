export function wrapAsync<A extends unknown[], R, S extends unknown[]>(
  inner: (...args: A) => Promise<R>,
  wrapper: (inner: () => Promise<R>, ...state: S) => Promise<R>,
  ...state: S
): (...args: A) => Promise<R> {
  return (...args: A) => {
    return wrapper(
      async () => {
        return await inner(...args);
      },
      ...state,
    );
  };
}
