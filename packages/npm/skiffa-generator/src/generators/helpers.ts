import * as skiffaCore from "@skiffa/core";

export function selectBodies(
  model: skiffaCore.OperationContainer | skiffaCore.OperationResultContainer,
  contentTypes: Array<string>,
) {
  const bodiesMap = Object.fromEntries(
    model.bodies.map((bodyModel) => [bodyModel.contentType, bodyModel]),
  );
  const bodies = contentTypes
    .map((requestType) => bodiesMap[requestType])
    .filter((bodyModel) => bodyModel != null);

  return bodies;
}

export function isOperationModelMockable(
  model: skiffaCore.OperationContainer,
  mockables: Set<string>,
  requestTypes: Array<string>,
  responseTypes: Array<string>,
) {
  return (
    [
      ...model.pathParameters,
      ...model.headerParameters,
      ...model.queryParameters,
      ...model.cookieParameters,
    ].every((model) => isParameterModelMockable(model, mockables) || !model.required) &&
    (model.bodies.length == 0 ||
      selectBodies(model, requestTypes).some((model) => isBodyModelMockable(model, mockables))) &&
    (model.operationResults.length == 0 ||
      model.operationResults.some((model) =>
        isOperationResultModelMockable(model, mockables, responseTypes),
      ))
  );
}

export function isOperationResultModelMockable(
  model: skiffaCore.OperationResultContainer,
  mockables: Set<string>,
  responseTypes: Array<string>,
) {
  return (
    [...model.headerParameters].every(
      (model) => isParameterModelMockable(model, mockables) || !model.required,
    ) &&
    (model.bodies.length == 0 ||
      selectBodies(model, responseTypes).some((model) => isBodyModelMockable(model, mockables)))
  );
}

export function isBodyModelMockable(model: skiffaCore.BodyContainer, mockables: Set<string>) {
  return (
    model.schemaId != null &&
    mockables.has(model.schemaId) &&
    (model.contentType === "application/json" || model.contentType === "text/plain")
  );
}

export function isParameterModelMockable(
  model: skiffaCore.ParameterContainer,
  mockables: Set<string>,
) {
  return model.schemaId == null || mockables.has(model.schemaId);
}
