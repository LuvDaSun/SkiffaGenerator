export function appendToUriHash(uri: URL, ...paths: (string | number)[]) {
  if (paths.length === 0) {
    return uri;
  }

  const hash = appendToPointer(uri.hash === "" ? "#" : uri.hash, ...paths);

  return new URL(hash, uri);
}

export function appendToPointer(base: string, ...paths: (string | number)[]) {
  if (paths.length === 0) {
    return base;
  }

  const pathsString = paths
    .map((path) => encodeURIComponent(path))
    .map((path) => `/${path}`)
    .join("");

  return base + pathsString;
}
