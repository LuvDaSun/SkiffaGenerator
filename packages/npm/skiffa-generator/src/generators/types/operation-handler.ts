import * as skiffaCore from "@skiffa/core";
import { itt } from "../../utils/iterable-text-template.js";
import { selectBodies } from "../helpers.js";
import {
  getOperationAcceptTypeName,
  getOperationAuthenticationTypeName,
  getOperationHandlerName,
  getOperationHandlerTypeName,
  getOperationHandlersTypeName,
  getRequestParametersTypeName,
  getResponseParametersTypeName,
  getServerAuthenticationTypeName,
} from "../names.js";

interface X {
  (contentType: "a", entity: number): [];
}
interface X {
  (contentType: "b", entity: string): [];
}

export function* generateOperationHandlerType(
  names: Record<string, string>,
  operationModel: skiffaCore.OperationContainer,
  requestTypes: string[],
  responseTypes: string[],
) {
  const operationHandlerTypeName = getOperationHandlerTypeName(operationModel);
  const operationAuthenticationName = getOperationAuthenticationTypeName(operationModel);
  const operationAcceptTypeName = getOperationAcceptTypeName(operationModel);
  const serverAuthenticationName = getServerAuthenticationTypeName();

  const operationResultModels = operationModel.operationResults;
  const requestBodyModels = selectBodies(operationModel, requestTypes);

  const hasParametersArgument =
    operationModel.pathParameters.length > 0 ||
    operationModel.queryParameters.length > 0 ||
    operationModel.headerParameters.length > 0 ||
    operationModel.cookieParameters.length > 0;
  const hasContentTypeArgument = requestBodyModels.length > 1;
  const hasEntityArgument = requestBodyModels.length > 0;
  const hasAuthenticationArgument = operationModel.authenticationRequirements.length > 0;
  const hasAcceptsArgument = operationResultModels.some(
    (model) => selectBodies(model, responseTypes).length > 1,
  );

  const hasStatusReturn = operationResultModels.length > 1;
  const hasParametersReturn = operationResultModels.some(
    (model) => model.headerParameters.length > 0,
  );
  const hasContentTypeReturn = operationResultModels.some(
    (model) => selectBodies(model, responseTypes).length > 1,
  );
  const hasEntityReturn = operationResultModels.some(
    (model) => selectBodies(model, responseTypes).length > 0,
  );

  if (requestBodyModels.length === 0) {
    yield generateHandlerInterface();
  }

  for (const requestBodyModel of requestBodyModels) {
    yield generateHandlerInterface(requestBodyModel);
  }

  function* generateHandlerInterface(requestBodyModel?: skiffaCore.BodyContainer) {
    const requestEntityTypeName =
      requestBodyModel?.schemaId == null ? null : names[requestBodyModel.schemaId];

    const functionArguments = new Array<[string, string]>();

    if (hasParametersArgument) {
      const parametersTypeName = getRequestParametersTypeName(operationModel);
      functionArguments.push(["parameters", `$parameters.${parametersTypeName}`]);
    }

    if (hasContentTypeArgument) {
      functionArguments.push([
        "contentType",
        JSON.stringify(requestBodyModel?.contentType ?? null),
      ]);
    }

    if (hasEntityArgument) {
      functionArguments.push([
        "entity",
        requestBodyModel == null
          ? "undefined"
          : requestEntityTypeName == null
            ? "unknown"
            : `types.${requestEntityTypeName}`,
      ]);
    }

    if (hasAuthenticationArgument) {
      functionArguments.push(["authentication", `${operationAuthenticationName}<A>`]);
    }

    if (hasAcceptsArgument) {
      functionArguments.push(["accepts", `accept.${operationAcceptTypeName}[]`]);
    }

    yield itt`
      export interface ${operationHandlerTypeName}<A extends ${serverAuthenticationName}> {
        (
          ${functionArguments.map(([name, type]) => `${name}: ${type},\n`).join("")}
        ): Promise<${generateHandlerReturnType()}>;
      } 
    `;
  }

  function* generateHandlerReturnType() {
    switch (operationResultModels.length) {
      case 0: {
        // no operation result
        yield "never";
        break;
      }
      default: {
        // one or multiple operation results
        let index = 0;
        for (const operationResultModel of operationResultModels) {
          if (index > 0) {
            yield " | ";
          }
          yield generateOperationResultReturnType(operationResultModel);
          index++;
        }
        break;
      }
    }
  }

  function* generateOperationResultReturnType(
    operationResultModel: skiffaCore.OperationResultContainer,
  ) {
    const responseBodyModels = selectBodies(operationResultModel, responseTypes);

    switch (responseBodyModels.length) {
      case 0: {
        //  no response body
        yield generateResponseBodyReturnType(operationResultModel, null);
        break;
      }
      default: {
        // one or multiple response bodies
        let index = 0;
        for (const responseBodyModel of responseBodyModels) {
          if (index > 0) {
            yield " | ";
          }
          yield generateResponseBodyReturnType(operationResultModel, responseBodyModel);
          index++;
        }
        break;
      }
    }
  }

  function* generateResponseBodyReturnType(
    operationResultModel: skiffaCore.OperationResultContainer,
    responseBodyModel: skiffaCore.BodyContainer | null,
  ) {
    const responseEntityTypeName =
      responseBodyModel?.schemaId == null ? null : names[responseBodyModel.schemaId];
    const isStream = responseBodyModel?.contentType === "application/x-ndjson";

    const tuple = new Array<[string, string]>();

    if (hasStatusReturn) {
      tuple.push([
        "status",
        [...operationResultModel.statusCodes].map((value) => JSON.stringify(value)).join(" | "),
      ]);
    }

    if (hasParametersReturn) {
      const parametersTypeName = getResponseParametersTypeName(
        operationModel,
        operationResultModel,
      );
      tuple.push(["parameters", `$parameters.${parametersTypeName}`]);
    }

    if (hasContentTypeReturn) {
      tuple.push(["contentType", JSON.stringify(responseBodyModel?.contentType ?? null)]);
    }

    if (hasEntityReturn) {
      tuple.push([
        "entity",
        responseBodyModel == null
          ? "undefined"
          : responseEntityTypeName == null
            ? isStream
              ? "(signal: AbortSignal) => AsyncIterable<unknown>"
              : "unknown"
            : isStream
              ? `(signal: AbortSignal) => AsyncIterable<types.${responseEntityTypeName}>`
              : `types.${responseEntityTypeName}`,
      ]);
    }

    switch (tuple.length) {
      case 0:
        yield "void";
        break;

      case 1:
        const [[_name, type]] = tuple as [[string, string]];
        yield type;
        break;

      default:
        yield `[
          ${tuple.map(([name, type]) => `${name}: ${type},\n`).join("")}
        ]`;
        break;
    }
  }
}

export function* generateOperationHandlersType(apiModel: skiffaCore.ApiContainer) {
  const serverAuthenticationName = getServerAuthenticationTypeName();
  const typeName = getOperationHandlersTypeName();

  yield itt`
    export type ${typeName}<A extends ${serverAuthenticationName}> = {
      ${body()}
    }
  `;

  function* body() {
    for (const pathModel of apiModel.paths) {
      for (const operationModel of pathModel.operations) {
        const propertyName = getOperationHandlerName(operationModel);
        const typeName = getOperationHandlerTypeName(operationModel);
        yield `
          ${propertyName}: ${typeName}<A>,
        `;
      }
    }
  }
}
