import * as skiffaCore from "@skiffa/core";
import { joinIterable, mapIterable } from "../../utils.js";
import { itt } from "../../utils/iterable-text-template.js";
import { selectBodies } from "../helpers.js";
import { getOutgoingRequestTypeName, getRequestParametersTypeName } from "../names.js";

export function* generateOperationOutgoingRequestType(
  names: Record<string, string>,
  operationModel: skiffaCore.OperationContainer,
  requestTypes: Array<string>,
) {
  const typeName = getOutgoingRequestTypeName(operationModel);

  yield itt`
    export type ${typeName} = ${joinIterable(
      mapIterable(
        generateElements(names, operationModel, requestTypes),
        (element) => itt`(${element})`,
      ),
      " |\n",
    )};
  `;
}

function* generateElements(
  names: Record<string, string>,
  operationModel: skiffaCore.OperationContainer,
  requestTypes: Array<string>,
) {
  yield itt`
    ${generateParametersContainerType(operationModel)} &
    (
      ${joinIterable(generateBodyContainerTypes(names, operationModel, requestTypes), " |\n")}
    )
  `;
}

function* generateParametersContainerType(operationModel: skiffaCore.OperationContainer) {
  const parametersTypeName = getRequestParametersTypeName(operationModel);

  const required =
    operationModel.pathParameters.some((parameter) => parameter.required) ||
    operationModel.queryParameters.some((parameter) => parameter.required) ||
    operationModel.headerParameters.some((parameter) => parameter.required) ||
    operationModel.cookieParameters.some((parameter) => parameter.required);

  if (required) {
    yield `lib.ParametersContainer<parameters.${parametersTypeName}>`;
  } else {
    yield `lib.OptionalParametersContainer<parameters.${parametersTypeName}>`;
  }
}

function* generateBodyContainerTypes(
  names: Record<string, string>,
  operationModel: skiffaCore.OperationContainer,
  requestTypes: Array<string>,
) {
  const requestBodyModels = selectBodies(operationModel, requestTypes);

  if (requestBodyModels.length === 0) {
    yield* generateBodyContainerType(names, operationModel);
  }

  for (const bodyModel of requestBodyModels) {
    yield* generateBodyContainerType(names, operationModel, bodyModel);
  }
}

function* generateBodyContainerType(
  names: Record<string, string>,
  operationModel: skiffaCore.OperationContainer,
  bodyModel?: skiffaCore.BodyContainer,
) {
  if (bodyModel == null) {
    yield itt`
      lib.OutgoingEmptyRequest
    `;
    return;
  }

  switch (bodyModel.contentType) {
    case "text/plain": {
      yield itt`
        lib.OutgoingTextRequest<
          ${JSON.stringify(bodyModel.contentType)}
        >
      `;
      break;
    }

    case "application/json": {
      const bodySchemaId = bodyModel.schemaId;
      const bodyTypeName = bodySchemaId == null ? bodySchemaId : names[bodySchemaId];

      yield itt`
        lib.OutgoingJsonRequest<
          ${JSON.stringify(bodyModel.contentType)},
          ${bodyTypeName == null ? "unknown" : itt`types.${bodyTypeName}`}
        >
      `;
      break;
    }

    case "application/x-ndjson": {
      const bodySchemaId = bodyModel.schemaId;
      const bodyTypeName = bodySchemaId == null ? bodySchemaId : names[bodySchemaId];

      yield itt`
        lib.OutgoingNdjsonRequest<
          ${JSON.stringify(bodyModel.contentType)},
          ${bodyTypeName == null ? "unknown" : itt`types.${bodyTypeName}`}
        >
      `;
      break;
    }

    default: {
      yield itt`
        lib.OutgoingStreamRequest<
          ${JSON.stringify(bodyModel.contentType)}
        >
      `;
      break;
    }
  }
}
