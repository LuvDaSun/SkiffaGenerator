export interface ServerWrappers {
  request: <T>(inner: () => Promise<T>) => Promise<T>;
  endpoint: <T>(inner: () => Promise<T>) => Promise<T>;
  authentication: <T>(inner: () => Promise<T>, name: string) => Promise<T>;
  operation: <T>(inner: () => Promise<T>, name: string) => Promise<T>;
  middleware: <T>(inner: () => Promise<T>, name: string) => Promise<T>;
}

export const defaultServerWrappers: ServerWrappers = {
  request: <T>(inner: () => Promise<T>) => inner(),
  endpoint: <T>(inner: () => Promise<T>) => inner(),
  authentication: <T>(inner: () => Promise<T>, name: string) => inner(),
  operation: <T>(inner: () => Promise<T>, name: string) => inner(),
  middleware: <T>(inner: () => Promise<T>, name: string) => inner(),
};
