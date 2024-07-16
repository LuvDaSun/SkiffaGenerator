export type NestedText = Iterable<NestedText> | string;

export function* iterableTextTemplate(
  strings: TemplateStringsArray,
  ...values: NestedText[]
): Iterable<NestedText> {
  for (let index = 0; index < strings.length + values.length; index++) {
    if (index % 2 === 0) {
      const stringValue = strings[index / 2];
      if (stringValue != null) {
        yield stringValue;
      }
    } else {
      const value = values[(index - 1) / 2];
      if (value != null) {
        yield value;
      }
    }
  }
}

export const itt = iterableTextTemplate;

export function* flattenNestedText(nestedText: NestedText): Iterable<string> {
  if (typeof nestedText === "string") {
    yield nestedText;
  } else {
    for (const text of nestedText) {
      yield* flattenNestedText(text);
    }
  }
}
