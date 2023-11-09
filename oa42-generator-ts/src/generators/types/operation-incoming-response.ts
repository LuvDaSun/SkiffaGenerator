import * as models from "../../models/index.js";
import { joinIterable } from "../../utils/index.js";
import { itt } from "../../utils/iterable-text-template.js";
import { toPascal } from "../../utils/name.js";

export function* generateOperationIncomingResponseType(
  apiModel: models.Api,
  operationModel: models.Operation,
) {
  const operationIncomingResponseName = toPascal(
    operationModel.name,
    "incoming",
    "response",
  );

  yield itt`
    export type ${operationIncomingResponseName} = ${joinIterable(
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
  const operationIncomingParametersName = toPascal(
    operationModel.name,
    operationResultModel.statusKind,
    "response",
    "parameters",
  );

  if (bodyModel == null) {
    yield itt`
      lib.IncomingEmptyResponse<
        ${joinIterable(
          operationResultModel.statusCodes.map((statusCode) =>
            JSON.stringify(statusCode),
          ),
          "|",
        )},
        shared.${operationIncomingParametersName}
      >
    `;
    return;
  }

  switch (bodyModel.contentType) {
    case "plain/text": {
      yield itt`
        lib.IncomingTextResponse<
          ${joinIterable(
            operationResultModel.statusCodes.map((statusCode) =>
              JSON.stringify(statusCode),
            ),
            "|",
          )},
          shared.${operationIncomingParametersName},
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
        lib.IncomingJsonResponse<
          ${joinIterable(
            operationResultModel.statusCodes.map((statusCode) =>
              JSON.stringify(statusCode),
            ),
            "|",
          )},
          shared.${operationIncomingParametersName},
          ${JSON.stringify(bodyModel.contentType)},
          ${bodyTypeName == null ? "unknown" : itt`shared.${bodyTypeName}`}
        >
      `;
      break;
    }
    default: {
      yield itt`
        lib.IncomingStreamResponse<
          ${joinIterable(
            operationResultModel.statusCodes.map((statusCode) =>
              JSON.stringify(statusCode),
            ),
            "|",
          )},
          shared.${operationIncomingParametersName},
          ${JSON.stringify(bodyModel.contentType)}
        >
      `;
      break;
    }
  }
}
