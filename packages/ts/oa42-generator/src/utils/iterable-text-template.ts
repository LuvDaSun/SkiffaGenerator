export type NestedText = Iterable<NestedText> | string;

export function* iterableTextTemplate(
  strings: TemplateStringsArray,
  ...values: NestedText[]
): Iterable<NestedText> {
  for (let index = 0; index < strings.length + values.length; index++) {
    if (index % 2 === 0) {
      yield strings[index / 2];
    } else {
      const value = values[(index - 1) / 2];
      yield value;
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
