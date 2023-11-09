import { Promisable } from "type-fest";
import { StatusCode } from "../utils/status-code.js";

//#region interfaces

export type OutgoingTextRequestDefault<P extends object> = {
  readonly parameters: P;
} & OutgoingTextContainer;

export type OutgoingTextRequest<P extends object, C extends string> = {
  readonly parameters: P;
  readonly contentType: C;
} & OutgoingTextContainer;

export type OutgoingTextResponseDefault<
  S extends StatusCode,
  P extends object,
> = {
  readonly status: S;
  readonly parameters: P;
} & OutgoingTextContainer;

export type OutgoingTextResponse<
  S extends StatusCode,
  P extends object,
  C extends string,
> = {
  readonly status: S;
  readonly parameters: P;
  readonly contentType: C;
} & OutgoingTextContainer;

export type IncomingTextRequest<P extends object, C extends string> = {
  readonly parameters: P;
  readonly contentType: C;
} & IncomingTextContainer;

export type IncomingTextResponse<
  S extends StatusCode,
  P extends object,
  C extends string,
> = {
  readonly status: S;
  readonly parameters: P;
  readonly contentType: C;
} & IncomingTextContainer;

//#endregion

//#region containers

export type OutgoingTextContainer =
  | { stream(signal?: AbortSignal): AsyncIterable<Uint8Array> }
  | { value(): Promisable<string> }
  | { lines(signal?: AbortSignal): AsyncIterable<string> };

export type IncomingTextContainer = {
  stream(signal?: AbortSignal): AsyncIterable<Uint8Array>;
} & { value(): Promisable<string> } & {
  lines(signal?: AbortSignal): AsyncIterable<string>;
};

//#endregion

//#region serialization

export async function* serializeTextValue(
  valuePromise: Promisable<string>,
): AsyncIterable<Uint8Array> {
  const encoder = new TextEncoder();

  const value = await valuePromise;
  yield encoder.encode(value);
}

export async function* serializeTextLines(
  lines: AsyncIterable<string>,
): AsyncIterable<Uint8Array> {
  const encoder = new TextEncoder();

  for await (const line of lines) {
    yield encoder.encode(line);
    yield encoder.encode("\n");
  }
}

export async function deserializeTextValue(
  stream: (signal?: AbortSignal) => AsyncIterable<Uint8Array>,
): Promise<string> {
  const decoder = new TextDecoder();

  let buffer = "";

  for await (const chunk of stream()) {
    buffer += decoder.decode(chunk, { stream: true });
  }

  return buffer;
}

export async function* deserializeTextLines(
  stream: (signal?: AbortSignal) => AsyncIterable<Uint8Array>,
  signal?: AbortSignal,
): AsyncIterable<string> {
  const decoder = new TextDecoder();
  const separator = /\r?\n/;
  let buffer = "";

  for await (const chunk of stream(signal)) {
    buffer += decoder.decode(chunk, { stream: true });

    yield* flush();
  }

  if (buffer.length > 0) yield buffer;

  function* flush() {
    while (true) {
      const match = separator.exec(buffer);
      if (!match) break;

      const line = buffer.substring(0, match.index);
      buffer = buffer.substring(match.index + match[0].length);

      yield line;
    }
  }
}

//#endregion
