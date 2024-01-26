import { ErrorBase } from "./base.js";

/**
 * base class for all client errors so we can easily check where the error came
 * from
 */
export abstract class ClientError extends ErrorBase {
  //
}

export class MissingClientResponseContentType extends ClientError {
  public readonly name = "MissingClientResponseContentType";

  constructor() {
    super(`Missing content-type in client response`);
  }
}

export class UnexpectedClientResponseContentType extends ClientError {
  public readonly name = "UnexpectedClientResponseContentType";

  constructor() {
    super(`Unexpected content-type in client response`);
  }
}

export class UnexpectedClientResponseStatusCode extends ClientError {
  public readonly name = "UnexpectedClientResponseStatusCode";

  constructor() {
    super(`Unexpected status code in client response`);
  }
}

export class ClientRequestParameterValidationFailed extends ClientError {
  public readonly name = "ClientRequestParameterValidationFailed";

  constructor(
    public readonly parameterName: string,
    public readonly path: string,
    public readonly rule: string,
  ) {
    super(
      `Client request parameter validation failed for parameter ${parameterName} path, ${path}, rule ${rule}`,
    );
  }
}

export class ClientResponseParameterValidationFailed extends ClientError {
  public readonly name = "ClientResponseParameterValidationFailed";

  constructor(
    public readonly parameterName: string,
    public readonly path: string,
    public readonly rule: string,
  ) {
    super(
      `Client response parameter validation failed for parameter ${parameterName} path, ${path}, rule ${rule}`,
    );
  }
}

export class ClientRequestEntityValidationFailed extends ClientError {
  public readonly name = "ClientRequestEntityValidationFailed";

  constructor(
    public readonly path: string,
    public readonly rule: string,
  ) {
    super(`Client request entity validation failed for path ${path}, rule ${rule}`);
  }
}

export class ClientResponseEntityValidationFailed extends ClientError {
  public readonly name = "ClientResponseEntityValidationFailed";

  constructor(
    public readonly path: string,
    public readonly rule: string,
  ) {
    super(`Client response entity validation failed for path ${path}, rule ${rule}`);
  }
}
