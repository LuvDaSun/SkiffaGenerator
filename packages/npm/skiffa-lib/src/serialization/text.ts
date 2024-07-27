export async function* serializeTextValue(
  value: string | Promise<string>,
): AsyncIterable<Uint8Array> {
  const encoder = new TextEncoder();

  yield encoder.encode(await value);
}

export async function* serializeTextLines(lines: AsyncIterable<string>): AsyncIterable<Uint8Array> {
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

  if (buffer.length > 0) {
    yield buffer;
  }

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
