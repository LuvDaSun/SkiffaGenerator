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

export class ClientRequestParameterValidationFailed extends ClientError {
  public readonly name = "ClientRequestParameterValidationFailed";

  constructor() {
    super(`Client request parameter validation failed`);
  }
}

export class ClientResponseParameterValidationFailed extends ClientError {
  public readonly name = "ClientResponseParameterValidationFailed";

  constructor() {
    super(`Client response parameter validation failed`);
  }
}

export class ClientRequestEntityValidationFailed extends ClientError {
  public readonly name = "ClientRequestEntityValidationFailed";

  constructor() {
    super(`Client request entity validation failed`);
  }
}

export class ClientResponseEntityValidationFailed extends ClientError {
  public readonly name = "ClientResponseEntityValidationFailed";

  constructor() {
    super(`Client response entity validation failed`);
  }
}
