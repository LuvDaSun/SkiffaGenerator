export function align(value: number, alignment: number) {
  return value + ((alignment - (value % alignment)) % alignment);
}
