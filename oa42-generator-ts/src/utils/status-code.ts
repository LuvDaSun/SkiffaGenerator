import { StatusCode } from "@oa42/oa42-lib";

export function isStatusCode(statusKind: string) {
  return /[1-5][0-9][0-9]/.test(statusKind);
}

export function isStatusClass(statusKind: string) {
  return /[1-5]XX/.test(statusKind);
}

export function isStatusDefault(statusKind: string) {
  return statusKind === "default";
}

export function statusKindComparer(statusKindA: string, statusKindB: string) {
  const valueA = isStatusCode(statusKindA)
    ? 3
    : isStatusClass(statusKindA)
    ? 2
    : isStatusDefault(statusKindA)
    ? 1
    : 0;

  const valueB = isStatusCode(statusKindB)
    ? 3
    : isStatusClass(statusKindB)
    ? 2
    : isStatusDefault(statusKindB)
    ? 1
    : 0;

  return valueB - valueA;
}

export function* takeStatusCodes(
  availableStatusCodes: Set<number>,
  statusKind: string,
) {
  let statusCodeOffset = 0;
  let statusCodeCount = 0;

  if (statusKind === "default") {
    statusCodeOffset = 100;
    statusCodeCount = 500;
  } else if (/^[1-5]XX$/.test(statusKind)) {
    statusCodeOffset = Number(statusKind[0]) * 100;
    statusCodeCount = 100;
  } else if (/^\d\d\d$/.test(statusKind)) {
    statusCodeOffset = Number(statusKind);
    statusCodeCount = 1;
  } else throw new Error(`bad statusKind '${statusKind}'`);

  for (
    let statusCode = statusCodeOffset;
    statusCode < statusCodeOffset + statusCodeCount;
    statusCode++
  ) {
    // if this statusCode is not available, continue;
    if (!availableStatusCodes.delete(statusCode)) continue;

    yield statusCode as StatusCode;
  }
}
