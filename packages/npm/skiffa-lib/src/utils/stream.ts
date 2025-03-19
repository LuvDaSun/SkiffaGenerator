export function toReadableStream(iterable: AsyncIterable<Uint8Array>): ReadableStream<Uint8Array> {
  let iterator: AsyncIterator<Uint8Array> | undefined;
  return new ReadableStream({
    type: "bytes",
    start(controller) {
      iterator = iterable[Symbol.asyncIterator]();
    },
    async pull(controller) {
      try {
        const next = await iterator!.next();
        if (next.done ?? false) {
          controller.close();
        } else {
          controller.enqueue(next.value);
        }
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

export async function* fromReadableStream(
  stream: ReadableStream<Uint8Array>,
  signal?: AbortSignal,
): AsyncIterable<Uint8Array> {
  if (signal?.aborted ?? false) {
    return;
  }

  const reader = stream.getReader();
  try {
    const onAbort = () => reader.cancel();
    signal?.addEventListener("abort", onAbort);
    try {
      let result = await reader.read();
      while (!result.done) {
        yield result.value;
        result = await reader.read();
      }
    } finally {
      signal?.removeEventListener("abort", onAbort);
    }
  } finally {
    reader.releaseLock();
  }
}

export async function collectStream(iterable: AsyncIterable<Uint8Array>) {
  let buffer = new Uint8Array(1024);
  let length = 0;

  for await (const chunk of iterable) {
    if (length + chunk.length > buffer.length) {
      let newSize = buffer.length * 2;
      while (length + chunk.length > newSize) {
        newSize *= 2;
      }

      const newBuffer = new Uint8Array(newSize);
      newBuffer.set(buffer);
      buffer = newBuffer;
    }
    buffer.set(chunk, length);
    length += chunk.length;
  }

  return buffer.subarray(0, length);
}
