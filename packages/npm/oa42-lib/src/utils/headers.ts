import { Base64 } from "js-base64";

export function parseAuthorizationHeader(scheme: string, values: Iterable<string>) {
  const prefix = scheme + " ";

  for (const value of values) {
    if (value.toLowerCase().startsWith(prefix.toLowerCase())) {
      return value.substring(prefix.length);
    }
  }
}

export function stringifyAuthorizationHeader(scheme: string, value: string) {
  const prefix = scheme + " ";

  return prefix + value;
}

export function parseBasicAuthorizationHeader(values: Iterable<string>) {
  const encoded = parseAuthorizationHeader("Basic", values);

  if (encoded == null) return;

  const decoded = Base64.decode(encoded);
  const [id, secret] = decoded.split(":", 2);

  return { id, secret };
}

export function stringifyBasicAuthorizationHeader(credential: { id: string; secret: string }) {
  const { id, secret } = credential;

  const decoded = id + ":" + secret;
  const encoded = Base64.encode(decoded);

  return stringifyAuthorizationHeader("Basic", encoded);
}

export function* parseContentTypeHeader(values: Iterable<string>) {
  for (const value of values) {
    const parts = value.split(";");
    yield parts[0];
  }
}

export function parseAcceptHeader<T extends string>(values: string[]) {
  const parsed = parse();
  const list = Array.from(parsed);
  list.sort(([, a], [, b]) => b - a);
  return list.map(([type]) => type);

  function* parse() {
    for (const header of values) {
      const entries = header.split(/\s*,\s*/);

      for (const entry of entries) {
        const parts = entry.split(/\s*;\s*/);
        const type = parts.shift() as T | undefined;

        if (type == null) {
          continue;
        }

        const values: Record<string, string> = {};
        for (const part of parts) {
          const pair = part.split(/\s*=\s*/, 2);
          if (pair.length !== 2) continue;

          const [key, value] = pair;
          values[key] = value;
        }
        if ("q" in values) {
          const q = parseFloat(values["q"]);

          if (isNaN(q)) {
            continue;
          }

          if (q <= 0) {
            continue;
          }

          if (q > 1) {
            yield [type, 1] as const;
            continue;
          }

          yield [type, q] as const;
          continue;
        }

        yield [type, 1] as const;
        continue;
      }
    }
  }
}

export function stringifyAcceptHeader<T extends string>(types: Iterable<T>) {
  const typesArray = Array.from(types);

  return typesArray.map((type, index) => `${type}; q=${1 - index / typesArray.length}`).join(", ");
}
