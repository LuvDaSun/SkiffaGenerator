import * as oa42Core from "@oa42/core";
import { joinIterable, mapIterable } from "../../utils/index.js";
import { itt } from "../../utils/iterable-text-template.js";
import { getOutgoingResponseTypeName, getResponseParametersTypeName } from "../names/index.js";

export function* generateOperationOutgoingResponseType(
  names: Record<string, string>,
  operationModel: oa42Core.OperationContainer,
) {
  const typeName = getOutgoingResponseTypeName(operationModel);

  yield itt`
    export type ${typeName} = ${joinIterable(
      mapIterable(generateElements(names, operationModel), (element) => itt`(${element})`),
      " |\n",
    )};
  `;
}

function* generateElements(
  names: Record<string, string>,
  operationModel: oa42Core.OperationContainer,
) {
  if (operationModel.operationResults.length === 0) {
    yield itt`never`;
  }

  for (const operationResultModel of operationModel.operationResults) {
    yield itt`
      ${generateParametersContainerType(operationModel, operationResultModel)} &
      (
        ${joinIterable(generateBodyContainerTypes(names, operationModel, operationResultModel), " |\n")}
      )
    `;
  }
}

function* generateParametersContainerType(
  operationModel: oa42Core.OperationContainer,
  operationResultModel: oa42Core.OperationResultContainer,
) {
  const parametersTypeName = getResponseParametersTypeName(operationModel, operationResultModel);

  const required = operationResultModel.headerParameters.some((parameter) => parameter.required);

  if (required) {
    yield `lib.ParametersContainer<parameters.${parametersTypeName}>`;
  } else {
    yield `lib.OptionalParametersContainer<parameters.${parametersTypeName}>`;
  }
}

function* generateBodyContainerTypes(
  names: Record<string, string>,
  operationModel: oa42Core.OperationContainer,
  operationResultModel: oa42Core.OperationResultContainer,
) {
  if (operationResultModel.bodies.length === 0) {
    yield* generateBodyContainerType(names, operationModel, operationResultModel);
  }

  for (const bodyModel of operationResultModel.bodies) {
    yield* generateBodyContainerType(names, operationModel, operationResultModel, bodyModel);
  }
}

function* generateBodyContainerType(
  names: Record<string, string>,
  operationModel: oa42Core.OperationContainer,
  operationResultModel: oa42Core.OperationResultContainer,
  bodyModel?: oa42Core.BodyContainer,
) {
  if (bodyModel == null) {
    yield itt`
      lib.OutgoingEmptyResponse<
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
        lib.OutgoingTextResponse<
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
      const bodyTypeName = bodySchemaId == null ? bodySchemaId : names[bodySchemaId];

      yield itt`
        lib.OutgoingJsonResponse<
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
        lib.OutgoingStreamResponse<
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
