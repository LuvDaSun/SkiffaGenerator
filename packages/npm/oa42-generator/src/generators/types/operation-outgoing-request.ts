import * as models from "../../models/index.js";
import { joinIterable, mapIterable } from "../../utils/index.js";
import { itt } from "../../utils/iterable-text-template.js";
import { getOutgoingRequestTypeName, getRequestParametersTypeName } from "../names/index.js";

export function* generateOperationOutgoingRequestType(
  apiModel: models.Api,
  operationModel: models.Operation,
) {
  const typeName = getOutgoingRequestTypeName(operationModel);

  yield itt`
    export type ${typeName} = ${joinIterable(
      mapIterable(generateElements(apiModel, operationModel), (element) => itt`(${element})`),
      " |\n",
    )};
  `;
}

function* generateElements(apiModel: models.Api, operationModel: models.Operation) {
  yield itt`
    ${generateParametersContainerType(operationModel)} &
    (
      ${joinIterable(generateBodyContainerTypes(apiModel, operationModel), " |\n")}
    )
  `;
}

function* generateParametersContainerType(operationModel: models.Operation) {
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

function* generateBodyContainerTypes(apiModel: models.Api, operationModel: models.Operation) {
  if (operationModel.bodies.length === 0) {
    yield* generateBodyContainerType(apiModel, operationModel);
  }

  for (const bodyModel of operationModel.bodies) {
    yield* generateBodyContainerType(apiModel, operationModel, bodyModel);
  }
}

function* generateBodyContainerType(
  apiModel: models.Api,
  operationModel: models.Operation,
  bodyModel?: models.Body,
) {
  if (bodyModel == null) {
    yield itt`
      lib.OutgoingEmptyRequest
    `;
    return;
  }

  switch (bodyModel.contentType) {
    case "plain/text": {
      yield itt`
        lib.OutgoingTextRequest<
          ${JSON.stringify(bodyModel.contentType)}
        >
      `;
      break;
    }
    case "application/json": {
      const bodySchemaId = bodyModel.schemaId;
      const bodyTypeName = bodySchemaId == null ? bodySchemaId : apiModel.names[bodySchemaId];

      yield itt`
        lib.OutgoingJsonRequest<
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
