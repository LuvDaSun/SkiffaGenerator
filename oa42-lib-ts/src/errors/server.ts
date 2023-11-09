import { ErrorBase } from "./base.js";

/**
 * base class for all server errors so we can easily check where the error came
 * from
 */
export abstract class ServerError extends ErrorBase {
  //
}

export class AuthenticationFailed extends ServerError {
  public readonly name = "AuthenticationFailed";

  constructor() {
    super(`Authentication failed`);
  }
}

export class MethodNotSupported extends ServerError {
  public readonly name = "MethodNotSupportedError";

  constructor() {
    super(`Method not supported`);
  }
}

export class NoRouteFound extends ServerError {
  public readonly name = "NoRouteFound";

  constructor() {
    super(`No route found`);
  }
}

export class OperationNotImplemented extends ServerError {
  public readonly name = "OperationNotImplemented";

  constructor() {
    super(`Operation not implemented`);
  }
}

export class MissingServerRequestContentType extends ServerError {
  public readonly name = "MissingServerRequestContentType";

  constructor() {
    super(`Missing content-type in server request`);
  }
}

export class UnexpectedServerRequestContentType extends ServerError {
  public readonly name = "UnexpectedServerRequestContentType";

  constructor() {
    super(`Unexpected content-type in server request`);
  }
}

export class ServerRequestParameterValidationFailed extends ServerError {
  public readonly name = "ServerRequestParameterValidationFailed";

  constructor() {
    super(`Server request parameter validation failed`);
  }
}

export class ServerResponseParameterValidationFailed extends ServerError {
  public readonly name = "ServerResponseParameterValidationFailed";

  constructor() {
    super(`Server response parameter validation failed`);
  }
}

export class ServerRequestEntityValidationFailed extends ServerError {
  public readonly name = "ServerRequestEntityValidationFailed";

  constructor() {
    super(`Server request entity validation failed`);
  }
}

export class ServerResponseEntityValidationFailed extends ServerError {
  public readonly name = "ServerResponseEntityValidationFailed";

  constructor() {
    super(`Server response entity validation failed`);
  }
}
