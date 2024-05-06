export function reverse(input: string) {
  const chars = [...input];
  chars.reverse();
  return chars.join("");
}
