export async function toArrayAsync<T>(
  iterable: AsyncIterable<T>,
): Promise<T[]> {
  const result = new Array<T>();
  for await (const element of iterable) {
    result.push(element);
  }
  return result;
}
