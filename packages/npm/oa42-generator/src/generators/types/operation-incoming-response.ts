import * as core from "@oa42/core";
import * as models from "../../models/index.js";
import { joinIterable, mapIterable } from "../../utils/index.js";
import { itt } from "../../utils/iterable-text-template.js";
import { getIncomingResponseTypeName, getResponseParametersTypeName } from "../names/index.js";

export function* generateOperationIncomingResponseType(
  apiModelLegacy: models.Api,
  operationModel: core.OperationContainer,
) {
  const typeName = getIncomingResponseTypeName(operationModel);

  yield itt`
    export type ${typeName} = ${joinIterable(
      mapIterable(generateElements(apiModelLegacy, operationModel), (element) => itt`(${element})`),
      " |\n",
    )};
  `;
}

function* generateElements(apiModelLegacy: models.Api, operationModel: core.OperationContainer) {
  if (operationModel.operationResults.length === 0) {
    yield itt`never`;
  }

  for (const operationResultModel of operationModel.operationResults) {
    yield itt`
      ${generateParametersContainerType(operationModel, operationResultModel)} &
      (
        ${joinIterable(generateBodyContainerTypes(apiModelLegacy, operationModel, operationResultModel), " |\n")}
      )
    `;
  }
}

function* generateParametersContainerType(
  operationModel: core.OperationContainer,
  operationResultModel: core.OperationResultContainer,
) {
  const parametersTypeName = getResponseParametersTypeName(operationModel, operationResultModel);

  yield `lib.ParametersContainer<parameters.${parametersTypeName}>`;
}

function* generateBodyContainerTypes(
  apiModelLegacy: models.Api,
  operationModel: core.OperationContainer,
  operationResultModel: core.OperationResultContainer,
) {
  if (operationResultModel.bodies.length === 0) {
    yield* generateBodyContainerType(apiModelLegacy, operationModel, operationResultModel);
  }

  for (const bodyModel of operationResultModel.bodies) {
    yield* generateBodyContainerType(
      apiModelLegacy,
      operationModel,
      operationResultModel,
      bodyModel,
    );
  }
}

function* generateBodyContainerType(
  apiModelLegacy: models.Api,
  operationModel: core.OperationContainer,
  operationResultModel: core.OperationResultContainer,
  bodyModel?: core.BodyContainer,
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
      const bodySchemaId = bodyModel.schemaId?.toString();
      const bodyTypeName = bodySchemaId == null ? bodySchemaId : apiModelLegacy.names[bodySchemaId];

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
