import camelcase from "camelcase";

const sanitizeRe = /^[^a-zA-Z]+|[^a-zA-Z0-9\s]+/gu;

export function toCamel(...parts: string[]) {
  const sourceName = parts.join(" ").replaceAll(sanitizeRe, " ");
  return camelcase(sourceName, {
    pascalCase: false,
    preserveConsecutiveUppercase: true,
  });
}

export function toPascal(...parts: string[]) {
  const sourceName = parts.join(" ").replaceAll(sanitizeRe, " ");
  return camelcase(sourceName, {
    pascalCase: true,
    preserveConsecutiveUppercase: true,
  });
}
