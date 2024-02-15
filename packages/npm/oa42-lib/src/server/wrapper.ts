export interface ServerWrappers {
  requestWrapper: <T>(inner: () => Promise<T>) => Promise<T>;
  endpointWrapper: <T>(inner: () => Promise<T>) => Promise<T>;
  authenticationWrapper: <T>(inner: () => Promise<T>, name: string) => Promise<T>;
  operationWrapper: <T>(inner: () => Promise<T>, name: string) => Promise<T>;
  middlewareWrapper: <T>(inner: () => Promise<T>, name: string) => Promise<T>;
}

export const defaultServerWrappers: ServerWrappers = {
  requestWrapper: <T>(inner: () => Promise<T>) => inner(),
  endpointWrapper: <T>(inner: () => Promise<T>) => inner(),
  authenticationWrapper: <T>(inner: () => Promise<T>, name: string) => inner(),
  operationWrapper: <T>(inner: () => Promise<T>, name: string) => inner(),
  middlewareWrapper: <T>(inner: () => Promise<T>, name: string) => inner(),
};
