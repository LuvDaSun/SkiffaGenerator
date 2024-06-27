export function wrapAsync<IA extends unknown[], IR, WA extends unknown[]>(
  inner: (...innerArguments: IA) => Promise<IR>,
  wrapper: (inner: () => Promise<IR>, ...wrapperArguments: WA) => Promise<IR>,
  ...wrapperArguments: WA
): (...args: IA) => Promise<IR> {
  return (...innerArguments: IA) => {
    return wrapper(
      async () => {
        return await inner(...innerArguments);
      },
      ...wrapperArguments,
    );
  };
}
