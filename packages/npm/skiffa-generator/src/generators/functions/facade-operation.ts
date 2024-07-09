import * as skiffaCore from "@skiffa/core";
import { itt } from "../../utils/index.js";
import { selectBodies } from "../helpers.js";
import {
  getOperationCredentialsTypeName,
  getOperationFunctionName,
  getOutgoingRequestTypeName,
  getRequestParametersTypeName,
} from "../names/index.js";

interface State {
  hasParametersArgument: boolean;
  hasContentTypeArgument: boolean;
  hasEntityArgument: boolean;

  hasStatusReturn: boolean;
  hasParametersReturn: boolean;
  hasContentTypeReturn: boolean;
  hasEntityReturn: boolean;
}

/**
 * Generates code for the facade (aka simple client). These functions call the advanced client.
 * These functions make it a bit easier to work with the API.
 *
 * The first argument of the function is the request parameters. These may be omitted if there
 * are no request parameters.
 *
 * The second argument is the request content type. If there is only one request content type,
 * this is omitted.
 *
 * The third argument is the request body. In case of json this is the entity, in case of text
 * this is the text value.
 *
 * And then there is an optional argument for credentials and configuration. These can also be
 * set globally and probably never have to be passed to the function.
 *
 * The generated function may return a tuple.
 *
 * The first field of the tuple is the statusCode, this field is only there if multiple
 * statusCodes are possible in the 200 - 300 range.
 *
 * The next field is the return parameters (headers). May be omitted if parameters are empty.
 *
 * The third field is the response content type. It is only available is there is at least one
 * response with a status code in the 200 - 300 range that has multiple content types.
 *
 * The last field is the body of the response. This may be omitted if none of the status codes
 * result in a response with a body.
 *
 * If the tuple is only one field, then we do not return the tuple, but only the field
 */

export function* generateFacadeOperationFunction(
  names: Record<string, string>,
  operationModel: skiffaCore.OperationContainer,
  requestTypes: Array<string>,
  responseTypes: Array<string>,
) {
  const operationFunctionName = getOperationFunctionName(operationModel);

  const jsDoc = [
    operationModel.deprecated ? "@deprecated" : "",
    operationModel.summary ?? "",
    operationModel.description ?? "",
  ]
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");

  const operationResultModels = operationModel.operationResults.filter((operationResultModel) =>
    operationResultModel.statusCodes.some((statusCode) => statusCode >= 200 && statusCode < 300),
  );
  const requestBodyModels = selectBodies(operationModel, requestTypes);

  const hasParametersArgument =
    operationModel.pathParameters.length > 0 ||
    operationModel.queryParameters.length > 0 ||
    operationModel.headerParameters.length > 0 ||
    operationModel.cookieParameters.length > 0;
  const hasContentTypeArgument = requestBodyModels.length > 1;
  const hasEntityArgument = requestBodyModels.length > 0;

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

  const state: State = {
    hasParametersArgument,
    hasContentTypeArgument,
    hasEntityArgument,

    hasStatusReturn,
    hasParametersReturn,
    hasContentTypeReturn,
    hasEntityReturn,
  };

  const parametersTypeName = getRequestParametersTypeName(operationModel);

  yield itt`
    /**
      ${jsDoc}
    */
    export async function ${operationFunctionName}(
      ...argument: ${generateOperationArgumentType(names, operationModel, requestTypes, state)}
    ): Promise<${generateOperationReturnType(names, operationResultModels, responseTypes, state)}> {
      ${generateBody(operationModel, requestTypes, responseTypes, state)}
    }
  `;
}

function* generateOperationArgumentType(
  names: Record<string, string>,
  operationModel: skiffaCore.OperationContainer,
  requestTypes: Array<string>,
  state: State,
) {
  const requestBodyModels = selectBodies(operationModel, requestTypes);

  switch (requestBodyModels.length) {
    case 0: {
      //  no response body
      yield generateRequestBodyArgumentType(names, operationModel, null, state);
      break;
    }
    case 1: {
      // default response body
      const [requestBodyModel] = requestBodyModels;
      yield generateRequestBodyArgumentType(names, operationModel, requestBodyModel, state);
      break;
    }
    default: {
      // multiple response bodies
      let index = 0;
      for (const requestBodyModel of requestBodyModels) {
        if (index > 0) {
          yield " | ";
        }
        yield generateRequestBodyArgumentType(names, operationModel, requestBodyModel, state);
        index++;
      }
      break;
    }
  }
}

function* generateOperationReturnType(
  names: Record<string, string>,
  operationResultModels: Array<skiffaCore.OperationResultContainer>,
  responseTypes: Array<string>,
  state: State,
) {
  switch (operationResultModels.length) {
    case 0: {
      // no operation result
      yield "never";
      break;
    }
    case 1: {
      // default operation result
      const [operationResultModel] = operationResultModels;
      yield generateOperationResultReturnType(names, operationResultModel, responseTypes, state);
      break;
    }
    default: {
      // multiple operation results
      let index = 0;
      for (const operationResultModel of operationResultModels) {
        if (index > 0) {
          yield " | ";
        }
        yield generateOperationResultReturnType(names, operationResultModel, responseTypes, state);
        index++;
      }
      break;
    }
  }
}

function* generateOperationResultReturnType(
  names: Record<string, string>,
  operationResultModel: skiffaCore.OperationResultContainer,
  responseTypes: Array<string>,
  state: State,
) {
  const responseBodyModels = selectBodies(operationResultModel, responseTypes);

  switch (responseBodyModels.length) {
    case 0: {
      //  no response body
      yield generateResponseBodyReturnType(names, operationResultModel, null, state);
      break;
    }
    case 1: {
      // default response body
      const [responseBodyModel] = responseBodyModels;
      yield generateResponseBodyReturnType(names, operationResultModel, responseBodyModel, state);
      break;
    }
    default: {
      // multiple response bodies
      let index = 0;
      for (const responseBodyModel of responseBodyModels) {
        if (index > 0) {
          yield " | ";
        }
        yield generateResponseBodyReturnType(names, operationResultModel, responseBodyModel, state);
        index++;
      }
      break;
    }
  }
}

function* generateRequestBodyArgumentType(
  names: Record<string, string>,
  operationModel: skiffaCore.OperationContainer,
  requestBodyModel: skiffaCore.BodyContainer | null,
  state: State,
) {
  const { hasParametersArgument, hasContentTypeArgument, hasEntityArgument } = state;

  const requestEntityTypeName =
    requestBodyModel?.schemaId == null ? null : names[requestBodyModel.schemaId];
  const credentialsName = getOperationCredentialsTypeName(operationModel);

  const tuple = new Array<string>();

  if (hasParametersArgument) {
    tuple.push(`parameters: result.parameters`);
  }

  if (hasContentTypeArgument) {
    tuple.push(`contentType: ${JSON.stringify(requestBodyModel?.contentType ?? null)}`);
  }

  if (hasEntityArgument) {
    tuple.push(
      `entity: ${
        requestBodyModel == null
          ? "undefined"
          : requestEntityTypeName == null
            ? "unknown"
            : `types.${requestEntityTypeName}`
      }`,
    );
  }

  tuple.push(`operationCredentials: client.${credentialsName}`);
  tuple.push(`operationConfiguration: client.ClientConfiguration`);

  yield `[
    ${tuple.map((element) => `${element}, `).join("")}
  ]`;
}

function* generateResponseBodyReturnType(
  names: Record<string, string>,
  operationResultModel: skiffaCore.OperationResultContainer,
  responseBodyModel: skiffaCore.BodyContainer | null,
  state: State,
) {
  const { hasStatusReturn, hasParametersReturn, hasContentTypeReturn, hasEntityReturn } = state;

  const responseEntityTypeName =
    responseBodyModel?.schemaId == null ? null : names[responseBodyModel.schemaId];

  const tuple = new Array<string>();

  if (hasStatusReturn) {
    tuple.push(
      [...operationResultModel.statusCodes]
        .filter((statusCode) => statusCode >= 200 && statusCode < 300)
        .map((value) => JSON.stringify(value))
        .join(" | "),
    );
  }

  if (hasParametersReturn) {
    tuple.push(`result.parameters`);
  }

  if (hasContentTypeReturn) {
    tuple.push(JSON.stringify(responseBodyModel?.contentType ?? null));
  }

  if (hasEntityReturn) {
    tuple.push(
      responseBodyModel == null
        ? "undefined"
        : responseEntityTypeName == null
          ? "unknown"
          : `types.${responseEntityTypeName}`,
    );
  }

  switch (tuple.length) {
    case 0:
      yield "void";
      break;

    case 1:
      const [element] = tuple;
      yield element;
      break;

    default:
      yield `[
        ${tuple.map((element) => `${element}, `).join("")}
      ]`;
      break;
  }
}

function* generateBody(
  operationModel: skiffaCore.OperationContainer,
  requestTypes: Array<string>,
  responseTypes: Array<string>,
  state: State,
) {
  const { hasParametersArgument, hasContentTypeArgument, hasEntityArgument } = state;

  const operationFunctionName = getOperationFunctionName(operationModel);
  const requestBodyModels = selectBodies(operationModel, requestTypes);
  const defaultRequestBodyModel = requestBodyModels.length === 1 ? requestBodyModels[0] : null;
  const operationOutgoingRequestName = getOutgoingRequestTypeName(operationModel);

  yield itt`
    const result = await client.${operationFunctionName}(
      {
        ${hasParametersArgument ? "parameters" : "parameters: {}"},
        ${hasContentTypeArgument ? "contentType" : `contentType: ${JSON.stringify(defaultRequestBodyModel?.contentType ?? null)}`},
        ${hasEntityArgument ? "entity: () => entity," : ""}
      } as client.${operationOutgoingRequestName},
      operationCredentials,
      operationConfiguration,
    );
  `;

  yield itt`
    switch(result.status) {
      ${generateStatusCodesCaseClauses(operationModel, responseTypes, state)}
    }
  `;
}

function* generateStatusCodesCaseClauses(
  operationModel: skiffaCore.OperationContainer,
  responseTypes: Array<string>,
  state: State,
) {
  for (const operationResultModel of operationModel.operationResults) {
    {
      const statusCodes = [...operationResultModel.statusCodes].filter(
        (statusCode) => statusCode >= 200 && statusCode < 300,
      );
      let statusCode;
      while ((statusCode = statusCodes.shift()) != null) {
        yield itt`case ${JSON.stringify(statusCode)}:`;
        // it's te last one!
        if (statusCodes.length === 0) {
          yield itt`
          {
            ${generateStatusCodeCaseBody(operationResultModel, responseTypes, state)}
            break;
          }
        `;
        }
      }
    }
    {
      const statusCodes = [...operationResultModel.statusCodes].filter(
        (statusCode) => !(statusCode >= 200 && statusCode < 300),
      );
      let statusCode;
      while ((statusCode = statusCodes.shift()) != null) {
        yield itt`case ${JSON.stringify(statusCode)}:`;
        // it's te last one!
        if (statusCodes.length === 0) {
          yield itt`
            throw new lib.UnexpectedStatusCode(result.status);
          `;
        }
      }
    }
  }

  yield itt`
    default:
      throw "cannot happen"
  `;
}

function* generateStatusCodeCaseBody(
  operationResultModel: skiffaCore.OperationResultContainer,
  responseTypes: Array<string>,
  state: State,
) {
  const responseBodyModels = selectBodies(operationResultModel, responseTypes);
  switch (responseBodyModels.length) {
    case 0: {
      yield generateContentReturnStatement(null, state);
    }
    default: {
      yield itt`
        switch(result.contentType) {
          ${generateContentTypesCaseClauses(operationResultModel, responseBodyModels, state)}
        }
      `;
      break;
    }
  }
}

function* generateContentTypesCaseClauses(
  operationResultModel: skiffaCore.OperationResultContainer,
  responseBodyModels: Array<skiffaCore.BodyContainer>,
  state: State,
) {
  for (const bodyModel of responseBodyModels) {
    yield itt`
      case ${JSON.stringify(bodyModel.contentType)}: {
        ${generateContentReturnStatement(bodyModel, state)}
      }
    `;
  }

  yield itt`
    default:
      throw "cannot happen";
    `;
}

function* generateContentReturnStatement(
  responseBodyModel: skiffaCore.BodyContainer | null,
  state: State,
) {
  const { hasStatusReturn, hasParametersReturn, hasContentTypeReturn, hasEntityReturn } = state;

  const tuple = new Array<string>();

  if (hasStatusReturn) {
    tuple.push("result.status");
  }

  if (hasParametersReturn) {
    tuple.push(`result.parameters`);
  }

  if (hasContentTypeReturn) {
    tuple.push(`result.contentType`);
  }

  if (hasEntityReturn) {
    tuple.push(
      responseBodyModel == null ? "undefined" : generateContentEntityExpression(responseBodyModel),
    );
  }

  switch (tuple.length) {
    case 0:
      yield "return;";
      break;

    case 1:
      const [element] = tuple;
      yield `return (${element});`;
      break;

    default:
      yield `return [
        ${tuple.map((element) => `${element}, `).join("")}
      ]`;
      break;
  }
}

function generateContentEntityExpression(responseBodyModel: skiffaCore.BodyContainer) {
  switch (responseBodyModel.contentType) {
    case "application/json":
      return `
        await result.entity()
      `;

    case "text/plain":
      return `
        await result.value()
      `;

    default:
      return `
        result.stream()
      `;
  }
}
