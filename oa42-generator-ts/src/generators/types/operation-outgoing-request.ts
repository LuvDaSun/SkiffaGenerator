import * as models from "../../models/index.js";
import { joinIterable } from "../../utils/index.js";
import { itt } from "../../utils/iterable-text-template.js";
import { toPascal } from "../../utils/name.js";

export function* generateOperationOutgoingRequestType(
  apiModel: models.Api,
  operationModel: models.Operation,
) {
  const operationOutgoingRequestName = toPascal(
    operationModel.name,
    "outgoing",
    "request",
  );

  yield itt`
    export type ${operationOutgoingRequestName} = ${joinIterable(
      generateRequestTypes(apiModel, operationModel),
      "|",
    )};
  `;
}

function* generateRequestTypes(
  apiModel: models.Api,
  operationModel: models.Operation,
) {
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
  const operationOutgoingParametersName = toPascal(
    operationModel.name,
    "request",
    "parameters",
  );

  if (bodyModel == null) {
    yield itt`
      lib.OutgoingEmptyRequest<shared.${operationOutgoingParametersName}>
    `;
    return;
  }

  switch (bodyModel.contentType) {
    case "plain/text": {
      yield itt`
        lib.OutgoingTextRequest<
          shared.${operationOutgoingParametersName},
          ${JSON.stringify(bodyModel.contentType)}
        >
      `;
      break;
    }
    case "application/json": {
      const bodySchemaId = bodyModel.schemaId;
      const bodyTypeName =
        bodySchemaId == null ? bodySchemaId : apiModel.names[bodySchemaId];

      yield itt`
        lib.OutgoingJsonRequest<
          shared.${operationOutgoingParametersName},
          ${JSON.stringify(bodyModel.contentType)},
          ${bodyTypeName == null ? "unknown" : itt`shared.${bodyTypeName}`}
        >
      `;
      break;
    }
    default: {
      yield itt`
        lib.OutgoingStreamRequest<
          shared.${operationOutgoingParametersName},
          ${JSON.stringify(bodyModel.contentType)}
        >
      `;
      break;
    }
  }
}
