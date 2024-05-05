import * as models from "../../models/index.js";
import { joinIterable, mapIterable } from "../../utils/index.js";
import { itt } from "../../utils/iterable-text-template.js";
import { getIncomingRequestTypeName, getRequestParametersTypeName } from "../names/index.js";

export function* generateOperationIncomingRequestType(
  apiModel: models.Api,
  operationModel: models.Operation,
) {
  const typeName = getIncomingRequestTypeName(operationModel);

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

  yield `lib.ParametersContainer<parameters.${parametersTypeName}>`;
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
      lib.IncomingEmptyRequest
    `;
    return;
  }

  switch (bodyModel.contentType) {
    case "plain/text": {
      yield itt`
        lib.IncomingTextRequest<
          ${JSON.stringify(bodyModel.contentType)}
        >
      `;
      break;
    }
    case "application/json": {
      const bodySchemaId = bodyModel.schemaId;
      const bodyTypeName = bodySchemaId == null ? bodySchemaId : apiModel.names[bodySchemaId];

      yield itt`
        lib.IncomingJsonRequest<
          ${JSON.stringify(bodyModel.contentType)},
          ${bodyTypeName == null ? "unknown" : itt`types.${bodyTypeName}`}
        >
      `;
      break;
    }
    default: {
      yield itt`
        lib.IncomingStreamRequest<
          ${JSON.stringify(bodyModel.contentType)}
        >
      `;
      break;
    }
  }
}
