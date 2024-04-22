export enum ForeignErrorCode {
  Ok = 0,
  Unknown,
  Conflict,
  NotFound,
  ParseLocationFailed,
  HttpError,
  IoError,
  NulMissing,
  Utf8Error,
  InvalidJson,
  NotARoot,
  NotTheSame,
  InvalidYaml,
}

function foreignCodeToString(code: ForeignErrorCode) {
  switch (code) {
    case ForeignErrorCode.Ok:
      return "Ok";
    case ForeignErrorCode.Unknown:
      return "Unknown";
    case ForeignErrorCode.Conflict:
      return "Conflict";
    case ForeignErrorCode.NotFound:
      return "NotFound";
    case ForeignErrorCode.ParseLocationFailed:
      return "ParseLocationFailed";
    case ForeignErrorCode.HttpError:
      return "HttpError";
    case ForeignErrorCode.IoError:
      return "IoError";
    case ForeignErrorCode.NulMissing:
      return "NulMissing";
    case ForeignErrorCode.Utf8Error:
      return "Utf8Error";
    case ForeignErrorCode.InvalidJson:
      return "InvalidJson";
    case ForeignErrorCode.NotARoot:
      return "NotARoot";
    case ForeignErrorCode.NotTheSame:
      return "NotTheSame";
    case ForeignErrorCode.InvalidYaml:
      return "InvalidYaml";
    default:
      return "";
  }
}

export class ForeignError extends Error {
  constructor(public readonly code: ForeignErrorCode) {
    const message = foreignCodeToString(code);
    super(message);
  }
}
