import * as models from "../../models/index.js";
import { joinIterable } from "../../utils/index.js";
import { itt } from "../../utils/iterable-text-template.js";
import { toPascal } from "../../utils/name.js";

export function* generateOperationOutgoingResponseType(
  apiModel: models.Api,
  operationModel: models.Operation,
) {
  const operationOutgoingResponseName = toPascal(
    operationModel.name,
    "outgoing",
    "response",
  );

  yield itt`
    export type ${operationOutgoingResponseName} = ${joinIterable(
      generateResponseTypes(apiModel, operationModel),
      "|",
    )};
  `;
}

function* generateResponseTypes(
  apiModel: models.Api,
  operationModel: models.Operation,
) {
  if (operationModel.operationResults.length === 0) {
    yield itt`never`;
  }

  for (const operationResultModel of operationModel.operationResults) {
    if (operationResultModel.bodies.length === 0) {
      yield* generateResponseBodies(
        apiModel,
        operationModel,
        operationResultModel,
      );
    }

    for (const bodyModel of operationResultModel.bodies) {
      yield* generateResponseBodies(
        apiModel,
        operationModel,
        operationResultModel,
        bodyModel,
      );
    }
  }
}

function* generateResponseBodies(
  apiModel: models.Api,
  operationModel: models.Operation,
  operationResultModel: models.OperationResult,
  bodyModel?: models.Body,
) {
  const operationOutgoingParametersName = toPascal(
    operationModel.name,
    operationResultModel.statusKind,
    "response",
    "parameters",
  );

  if (bodyModel == null) {
    yield itt`
      lib.OutgoingEmptyResponse<
        ${joinIterable(
          operationResultModel.statusCodes.map((statusCode) =>
            JSON.stringify(statusCode),
          ),
          "|",
        )},
        shared.${operationOutgoingParametersName}
      >
    `;
    return;
  }

  switch (bodyModel.contentType) {
    case "plain/text": {
      yield itt`
        lib.OutgoingTextResponse<
          ${joinIterable(
            operationResultModel.statusCodes.map((statusCode) =>
              JSON.stringify(statusCode),
            ),
            "|",
          )},
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
        lib.OutgoingJsonResponse<
          ${joinIterable(
            operationResultModel.statusCodes.map((statusCode) =>
              JSON.stringify(statusCode),
            ),
            "|",
          )},
          shared.${operationOutgoingParametersName},
          ${JSON.stringify(bodyModel.contentType)},
          ${bodyTypeName == null ? "unknown" : itt`shared.${bodyTypeName}`}
        >
      `;
      break;
    }
    default: {
      yield itt`
        lib.OutgoingStreamResponse<
          ${joinIterable(
            operationResultModel.statusCodes.map((statusCode) =>
              JSON.stringify(statusCode),
            ),
            "|",
          )},
          shared.${operationOutgoingParametersName},
          ${JSON.stringify(bodyModel.contentType)}
        >
      `;
      break;
    }
  }
}
