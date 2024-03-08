export function* readNode(prefix: string[], node: unknown): Iterable<[string[], unknown]> {
  yield [prefix, node];

  if (node != null && typeof node === "object") {
    for (const key in node) {
      yield* readNode([...prefix, key], node[key as keyof typeof node]);
    }
  }
}
