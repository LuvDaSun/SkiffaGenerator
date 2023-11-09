export function toReadableStream(
  iterable: AsyncIterable<Uint8Array>,
): ReadableStream<Uint8Array> {
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

  const onAbort = () => stream.cancel();
  signal?.addEventListener("abort", onAbort);
  try {
    const reader = stream.getReader();
    try {
      let result = await reader.read();
      while (!result.done) {
        yield result.value;
        result = await reader.read();
      }
    } finally {
      reader.releaseLock();
    }
  } finally {
    signal?.removeEventListener("abort", onAbort);
  }
}
