import * as oa42Core from "@oa42/core";

export function isOperationModelMockable(
  model: oa42Core.OperationContainer,
  mockables: Set<string>,
) {
  return (
    [
      ...model.pathParameters,
      ...model.headerParameters,
      ...model.queryParameters,
      ...model.cookieParameters,
    ].every((model) => isParameterModelMockable(model, mockables)) &&
    (model.bodies.length == 0 ||
      model.bodies.some((model) => isBodyModelMockable(model, mockables))) &&
    (model.operationResults.length == 0 ||
      model.operationResults.some((model) => isOperationResultModelMockable(model, mockables)))
  );
}

export function isOperationResultModelMockable(
  model: oa42Core.OperationResultContainer,
  mockables: Set<string>,
) {
  return (
    [...model.headerParameters].every((model) => isParameterModelMockable(model, mockables)) &&
    (model.bodies.length == 0 ||
      model.bodies.some((model) => isBodyModelMockable(model, mockables)))
  );
}

export function isBodyModelMockable(model: oa42Core.BodyContainer, mockables: Set<string>) {
  return (
    (model.schemaId == null || mockables.has(model.schemaId)) &&
    model.contentType === "application/json"
  );
}

export function isParameterModelMockable(
  model: oa42Core.ParameterContainer,
  mockables: Set<string>,
) {
  return model.schemaId == null || mockables.has(model.schemaId) || !model.required;
}
