import * as skiffaCore from "@skiffa/core";
import { joinIterable, mapIterable } from "../../utils/index.js";
import { itt } from "../../utils/iterable-text-template.js";
import { selectBodies } from "../helpers.js";
import { getIncomingResponseTypeName, getResponseParametersTypeName } from "../names/index.js";

export function* generateOperationIncomingResponseType(
  names: Record<string, string>,
  operationModel: skiffaCore.OperationContainer,
  responseTypes: Array<string>,
) {
  const typeName = getIncomingResponseTypeName(operationModel);

  yield itt`
    export type ${typeName} = ${joinIterable(
      mapIterable(
        generateElements(names, operationModel, responseTypes),
        (element) => itt`(${element})`,
      ),
      " |\n",
    )};
  `;
}

function* generateElements(
  names: Record<string, string>,
  operationModel: skiffaCore.OperationContainer,
  responseTypes: Array<string>,
) {
  if (operationModel.operationResults.length === 0) {
    yield itt`never`;
  }

  for (const operationResultModel of operationModel.operationResults) {
    yield itt`
      ${generateParametersContainerType(operationModel, operationResultModel)} &
      (
        ${joinIterable(generateBodyContainerTypes(names, operationModel, operationResultModel, responseTypes), " |\n")}
      )
    `;
  }
}

function* generateParametersContainerType(
  operationModel: skiffaCore.OperationContainer,
  operationResultModel: skiffaCore.OperationResultContainer,
) {
  const parametersTypeName = getResponseParametersTypeName(operationModel, operationResultModel);

  yield `lib.ParametersContainer<parameters.${parametersTypeName}>`;
}

function* generateBodyContainerTypes(
  names: Record<string, string>,
  operationModel: skiffaCore.OperationContainer,
  operationResultModel: skiffaCore.OperationResultContainer,
  responseTypes: Array<string>,
) {
  const responseBodyModels = selectBodies(operationResultModel, responseTypes);

  if (responseBodyModels.length === 0) {
    yield* generateBodyContainerType(names, operationModel, operationResultModel);
  }

  for (const bodyModel of responseBodyModels) {
    yield* generateBodyContainerType(names, operationModel, operationResultModel, bodyModel);
  }
}

function* generateBodyContainerType(
  names: Record<string, string>,
  operationModel: skiffaCore.OperationContainer,
  operationResultModel: skiffaCore.OperationResultContainer,
  bodyModel?: skiffaCore.BodyContainer,
) {
  if (bodyModel == null) {
    yield itt`
      lib.IncomingEmptyResponse<
        ${joinIterable(
          [...operationResultModel.statusCodes].map((statusCode) => JSON.stringify(statusCode)),
          " |\n",
        )}
      >
    `;
    return;
  }

  switch (bodyModel.contentType) {
    case "text/plain": {
      yield itt`
        lib.IncomingTextResponse<
          ${joinIterable(
            [...operationResultModel.statusCodes].map((statusCode) => JSON.stringify(statusCode)),
            " |\n",
          )},
          ${JSON.stringify(bodyModel.contentType)}
        >
      `;
      break;
    }
    case "application/json": {
      const bodySchemaId = bodyModel.schemaId;
      const bodyTypeName = bodySchemaId == null ? bodySchemaId : names[bodySchemaId];

      yield itt`
        lib.IncomingJsonResponse<
          ${joinIterable(
            [...operationResultModel.statusCodes].map((statusCode) => JSON.stringify(statusCode)),
            " |\n",
          )},
          ${JSON.stringify(bodyModel.contentType)},
          ${bodyTypeName == null ? "unknown" : itt`types.${bodyTypeName}`}
        >
      `;
      break;
    }
    default: {
      yield itt`
        lib.IncomingStreamResponse<
          ${joinIterable(
            [...operationResultModel.statusCodes].map((statusCode) => JSON.stringify(statusCode)),
            " |\n",
          )},
          ${JSON.stringify(bodyModel.contentType)}
        >
      `;
      break;
    }
  }
}
