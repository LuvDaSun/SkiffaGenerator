export type Parameters = Record<string, string | string[]>;

export function parseParameters(
  strings: string[],
  prefix = "?",
  separator = "&",
  assignment = "=",
): Parameters {
  const entries = new Array<[string, string][]>();
  for (const str of strings) {
    entries.push(parseParameterEntries(str, prefix, separator, assignment));
  }
  return parametersFromEntries(entries.flat());
}

export function stringifyParameters(
  parameters: Parameters,
  prefix = "?",
  separator = "&",
  assignment = "=",
): string {
  return stringifyParameterEntries(parametersToEntries(parameters), prefix, separator, assignment);
}

export function parseParameterEntries(
  str: string,
  prefix = "?",
  separator = "&",
  assignment = "=",
) {
  if (!str.startsWith(prefix)) {
    return [];
  }

  if (separator === assignment) {
    return str
      .substring(prefix.length)
      .split(separator)
      .reduce((entries, element, index) => {
        if (index % 2 === 0) {
          entries.push([element, ""]);
        } else {
          entries[entries.length - 1][1] = element;
        }
        return entries;
      }, new Array<[string, string]>());
  } else {
    return str
      .substring(prefix.length)
      .split(separator)
      .map((part) => part.split(assignment, 2) as [string, string]);
  }
}

export function stringifyParameterEntries(
  iterable: Iterable<[string, string]>,
  prefix = "?",
  separator = "&",
  assignment = "=",
) {
  let str = "";

  let index = 0;
  for (const [name, value] of iterable) {
    if (index === 0) {
      str += prefix;
    } else {
      str += separator;
    }
    str += name;
    str += assignment;
    str += value;

    index++;
  }

  return str;
}

export function parametersFromEntries(iterable: Iterable<[string, string]>): Parameters {
  const parameters = {} as Parameters;
  for (const [name, value] of iterable) {
    addParameter(parameters, name, value);
  }
  return parameters;
}

export function* parametersToEntries(parameters: Parameters): Iterable<[string, string]> {
  for (const name of Object.keys(parameters)) {
    yield* getParameterValues(parameters, name).map((value) => [name, value] as [string, string]);
  }
}

export function getParameterValues(parameters: Parameters, name: string): string[] {
  let value = parameters[name];

  if (value == null) return [];

  if (!Array.isArray(value)) {
    value = [value];
  }

  return value;
}

export function addParameter(parameters: Parameters, name: string, value: string) {
  if (parameters[name] == null) {
    parameters[name] = value;
  } else {
    parameters[name] = [...getParameterValues(parameters, name), value];
  }
}

export function clearParameter(parameters: Parameters, name: string) {
  delete parameters[name];
}

export function getAllParameterNames(parameters: Parameters) {
  return Object.keys(parameters);
}
