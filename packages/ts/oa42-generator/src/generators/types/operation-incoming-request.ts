import * as models from "../../models/index.js";
import { joinIterable } from "../../utils/index.js";
import { itt } from "../../utils/iterable-text-template.js";
import { toPascal } from "../../utils/name.js";

export function* generateOperationIncomingRequestType(
  apiModel: models.Api,
  operationModel: models.Operation,
) {
  const operationIncomingRequestName = toPascal(operationModel.name, "incoming", "request");

  yield itt`
    export type ${operationIncomingRequestName} = ${joinIterable(
      generateRequestTypes(apiModel, operationModel),
      "|",
    )};
  `;
}

function* generateRequestTypes(apiModel: models.Api, operationModel: models.Operation) {
  if (operationModel.bodies.length === 0) {
    yield* generateRequestBodies(apiModel, operationModel);
  }

  for (const bodyModel of operationModel.bodies) {
    yield* generateRequestBodies(apiModel, operationModel, bodyModel);
  }
}

function* generateRequestBodies(
  apiModel: models.Api,
  operationModel: models.Operation,
  bodyModel?: models.Body,
) {
  const operationIncomingParametersName = toPascal(operationModel.name, "request", "parameters");

  if (bodyModel == null) {
    yield itt`
      lib.IncomingEmptyRequest<parameters.${operationIncomingParametersName}>
    `;
    return;
  }

  switch (bodyModel.contentType) {
    case "plain/text": {
      yield itt`
        lib.IncomingTextRequest<
          parameters.${operationIncomingParametersName},
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
          parameters.${operationIncomingParametersName},
          ${JSON.stringify(bodyModel.contentType)},
          ${bodyTypeName == null ? "unknown" : itt`types.${bodyTypeName}`}
        >
      `;
      break;
    }
    default: {
      yield itt`
        lib.IncomingStreamRequest<
          parameters.${operationIncomingParametersName},
          ${JSON.stringify(bodyModel.contentType)}
        >
      `;
      break;
    }
  }
}
