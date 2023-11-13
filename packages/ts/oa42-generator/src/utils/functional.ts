export function* joinIterable<T, G>(iterable: Iterable<T>, glue: G): Iterable<T | G> {
  let count = 0;
  for (const item of iterable) {
    if (count > 0) {
      yield glue;
    }
    yield item;
    count++;
  }
}
