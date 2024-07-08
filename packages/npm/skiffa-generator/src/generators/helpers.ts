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
