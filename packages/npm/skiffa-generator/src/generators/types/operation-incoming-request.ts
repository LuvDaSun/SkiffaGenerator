import * as skiffaCore from "@skiffa/core";
import { joinIterable, mapIterable } from "../../utils.js";
import { itt } from "../../utils/iterable-text-template.js";
import { selectBodies } from "../helpers.js";
import { getIncomingRequestTypeName, getRequestParametersTypeName } from "../names.js";

export function* generateOperationIncomingRequestType(
  names: Record<string, string>,
  operationModel: skiffaCore.OperationContainer,
  requestTypes: Array<string>,
) {
  const typeName = getIncomingRequestTypeName(operationModel);

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

  yield `lib.ParametersContainer<parameters.${parametersTypeName}>`;
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
      lib.IncomingEmptyRequest
    `;
    return;
  }

  switch (bodyModel.contentType) {
    case "text/plain": {
      yield itt`
        lib.IncomingTextRequest<
          ${JSON.stringify(bodyModel.contentType)}
        >
      `;
      break;
    }
    case "application/json": {
      const bodySchemaId = bodyModel.schemaId;
      const bodyTypeName = bodySchemaId == null ? bodySchemaId : names[bodySchemaId];

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
