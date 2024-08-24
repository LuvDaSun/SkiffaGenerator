import { mapIterable } from "@jns42/generator";
import * as skiffaCore from "@skiffa/core";
import assert from "assert";
import { packageInfo } from "../../utils.js";
import { itt, NestedText } from "../../utils/iterable-text-template.js";
import {
  isBodyModelMockable,
  isOperationModelMockable,
  isOperationResultModelMockable,
  isParameterModelMockable,
  selectBodies,
} from "../helpers.js";
import {
  getAuthenticationMemberName,
  getIsBodyFunction,
  getIsParameterFunction,
  getMockBodyFunction,
  getMockParameterFunction,
  getOperationFunctionName,
  getParameterMemberName,
  getRegisterAuthenticationHandlerName,
  getRegisterOperationHandlerName,
} from "../names.js";

export function* generateClientServerTestTsCode(
  names: Record<string, string>,
  mockables: Set<string>,
  apiModel: skiffaCore.ApiContainer,
  requestTypes: Array<string>,
  responseTypes: Array<string>,
) {
  yield skiffaCore.banner("//", `v${packageInfo.version}`);

  yield itt`
    import assert from "assert/strict";
    import test from "node:test";
    import * as lib from "@skiffa/lib";

    import * as server from "./server.js";
    import * as client from "./client.js";
    import * as validators from "./validators.js";
    import * as mocks from "./mocks.js";
  `;

  yield itt`
    type ApiServerAuthentication = {
      ${apiModel.authentication.map((authenticationModel) => itt`${getAuthenticationMemberName(authenticationModel)}: boolean,`)}
    };
  `;

  for (const pathModel of apiModel.paths) {
    for (const operationModel of pathModel.operations) {
      if (!isOperationModelMockable(operationModel, mockables, requestTypes, responseTypes)) {
        continue;
      }

      yield generateOperationTest(
        names,
        mockables,
        apiModel,
        operationModel,
        requestTypes,
        responseTypes,
      );
    }
  }
}

function* generateOperationTest(
  names: Record<string, string>,
  mockables: Set<string>,
  apiModel: skiffaCore.ApiContainer,
  operationModel: skiffaCore.OperationContainer,
  requestTypes: string[],
  responseTypes: string[],
) {
  const requestBodyModels = selectBodies(operationModel, requestTypes);
  const clientOperationResultModels = operationModel.operationResults.filter(
    (operationResultModel) =>
      operationResultModel.statusCodes.some((statusCode) => statusCode >= 200 && statusCode < 300),
  );
  const serverOperationResultModels = operationModel.operationResults;

  const authenticationNames = new Set(
    operationModel.authenticationRequirements.flatMap((group) =>
      group.requirements.map((requirement) => requirement.authenticationName),
    ),
  );
  const authenticationModels = apiModel.authentication.filter((authenticationModel) =>
    authenticationNames.has(authenticationModel.name),
  );

  const registerOperationHandlerMethodName = getRegisterOperationHandlerName(operationModel);

  const hasParametersArgument =
    operationModel.pathParameters.length > 0 ||
    operationModel.queryParameters.length > 0 ||
    operationModel.headerParameters.length > 0 ||
    operationModel.cookieParameters.length > 0;
  const hasContentTypeArgument = requestBodyModels.length > 1;
  const hasEntityArgument = requestBodyModels.length > 0;
  const hasAuthenticationArgument = operationModel.authenticationRequirements.length > 0;
  const hasServerAcceptsArgument = serverOperationResultModels.some(
    (model) => selectBodies(model, responseTypes).length > 1,
  );

  const hasClientStatusReturn =
    clientOperationResultModels.flatMap((model) => model.statusCodes).length > 1;
  const hasServerStatusReturn =
    serverOperationResultModels.flatMap((model) => model.statusCodes).length > 1;
  const hasClientParametersReturn = clientOperationResultModels.some(
    (model) => model.headerParameters.length > 0,
  );
  const hasServerParametersReturn = serverOperationResultModels.some(
    (model) => model.headerParameters.length > 0,
  );
  const hasClientContentTypeReturn = clientOperationResultModels.some(
    (model) => selectBodies(model, responseTypes).length > 1,
  );
  const hasServerContentTypeReturn = serverOperationResultModels.some(
    (model) => selectBodies(model, responseTypes).length > 1,
  );
  const hasClientEntityReturn = clientOperationResultModels.some(
    (model) => selectBodies(model, responseTypes).length > 0,
  );
  const hasServerEntityReturn = serverOperationResultModels.some(
    (model) => selectBodies(model, responseTypes).length > 0,
  );

  if (requestBodyModels.length === 0) {
    for (const operationResultModel of clientOperationResultModels) {
      if (!isOperationResultModelMockable(operationResultModel, mockables, responseTypes)) {
        continue;
      }

      const responseBodyModels = selectBodies(operationResultModel, responseTypes);

      if (responseBodyModels.length === 0) {
        yield generateOperationResultTest(null, operationResultModel, null);
      }
      for (const responseBodyModel of responseBodyModels) {
        if (!isBodyModelMockable(responseBodyModel, mockables)) {
          continue;
        }

        yield generateOperationResultTest(null, operationResultModel, responseBodyModel);
      }
    }
  }
  for (const requestBodyModel of requestBodyModels) {
    if (!isBodyModelMockable(requestBodyModel, mockables)) {
      continue;
    }

    for (const operationResultModel of operationModel.operationResults) {
      if (!isOperationResultModelMockable(operationResultModel, mockables, responseTypes)) {
        continue;
      }

      const responseBodyModels = selectBodies(operationResultModel, responseTypes);

      if (responseBodyModels.length === 0) {
        yield generateOperationResultTest(requestBodyModel, operationResultModel, null);
      }
      for (const responseBodyModel of responseBodyModels) {
        if (!isBodyModelMockable(responseBodyModel, mockables)) {
          continue;
        }

        yield generateOperationResultTest(
          requestBodyModel,
          operationResultModel,
          responseBodyModel,
        );
      }
    }
  }

  function* generateOperationResultTest(
    requestBodyModel: skiffaCore.BodyContainer | null,
    operationResultModel: skiffaCore.OperationResultContainer,
    responseBodyModel: skiffaCore.BodyContainer | null,
  ) {
    let testNameParts = new Array<string>();
    testNameParts.push(operationModel.name);
    if (requestBodyModel != null) {
      testNameParts.push(requestBodyModel.contentType);
    }
    testNameParts.push(operationResultModel.statusKind);
    if (responseBodyModel != null) {
      testNameParts.push(responseBodyModel.contentType);
    }

    let statusCode = 0;
    // only 200 - 300
    for (statusCode of operationResultModel.statusCodes) {
      if (statusCode >= 200 && statusCode < 300) {
        break;
      }
    }

    yield itt`
    test(${JSON.stringify(testNameParts.join(" "))}, async () => {
      ${generateTestBody()}
    });
  `;

    function* generateTestBody() {
      const handlerArguments = new Array<string>();
      if (hasParametersArgument) {
        handlerArguments.push("parameters");
      }

      if (hasContentTypeArgument) {
        handlerArguments.push("contentType");
      }

      if (hasEntityArgument) {
        handlerArguments.push("entity");
      }

      if (hasAuthenticationArgument) {
        handlerArguments.push("authentication");
      }

      if (hasServerAcceptsArgument) {
        handlerArguments.push("accepts");
      }

      yield itt`
        const apiServer = new server.Server<ApiServerAuthentication>({
          validateIncomingParameters: false,
          validateIncomingEntity: false,
          validateOutgoingParameters: false,
          validateOutgoingEntity: false,
        });
        apiServer.${registerOperationHandlerMethodName}(async (${handlerArguments.join(", ")}) => {
          ${generateServerOperationHandler()}
        });
      `;
      for (const authenticationModel of authenticationModels) {
        const registerAuthenticationHandlerMethodName =
          getRegisterAuthenticationHandlerName(authenticationModel);

        switch (authenticationModel.type) {
          case "apiKey":
            yield itt`
            apiServer.${registerAuthenticationHandlerMethodName}(
              async (credential) => credential === "super-secret-api-key"
            )
          `;
            break;
          case "http":
            switch (authenticationModel.scheme) {
              case "basic":
                yield itt`
                apiServer.${registerAuthenticationHandlerMethodName}(
                  async (credential) =>
                    credential.id === "elmerbulthuis" && credential.secret === "welkom123"
                )
              `;
                break;

              case "bearer":
                yield itt`
                apiServer.${registerAuthenticationHandlerMethodName}(
                  async (credential) => credential === "super-secret-api-key"
                )
              `;
                break;

              default: {
                throw "impossible";
              }
            }
            break;

          case "oauth2": {
            // WARN
            break;
          }

          case "openIdConnect": {
            // WARN
            break;
          }

          default: {
            throw "impossible";
          }
        }
      }
      yield itt`
        let lastError: unknown;
        await using listener = await lib.listen(apiServer, {});
        const { port } = listener;
        const baseUrl = new URL(\`http://localhost:\${port}\`);
      `;
      yield generateClientTest();
    }

    function* generateServerOperationHandler() {
      for (const parameterModel of [
        ...operationModel.cookieParameters,
        ...operationModel.headerParameters,
        ...operationModel.pathParameters,
        ...operationModel.queryParameters,
      ]) {
        if (!isParameterModelMockable(parameterModel, mockables)) {
          continue;
        }

        const validateFunctionName = getIsParameterFunction(names, parameterModel);
        assert(validateFunctionName != null);

        yield itt`
          {
            const parameterValue = $parameters.${getParameterMemberName(parameterModel)};
            const valid = validators.${validateFunctionName}(parameterValue);
            assert.equal(valid, true);
          }
        `;
      }

      if (requestBodyModel != null) {
        if (hasContentTypeArgument) {
          yield itt`
            assert.equal(contentType, ${JSON.stringify(requestBodyModel.contentType)})
          `;
        }

        switch (requestBodyModel.contentType) {
          case "text/plain":
          case "application/json": {
            const validateFunctionName = getIsBodyFunction(names, requestBodyModel);
            assert(validateFunctionName != null);

            yield itt`
              {
                const valid = validators.${validateFunctionName}(entity);
                assert.equal(valid, true);
              }
            `;
            break;
          }

          default:
            throw new Error("unsupported content-type");
        }
      }

      const tuple = new Array<string>();
      if (hasServerStatusReturn) {
        tuple.push(JSON.stringify(statusCode));
      }

      if (hasServerParametersReturn) {
        tuple.push(`{${generateResponseParametersMockBody()}}`);
      }

      if (hasServerContentTypeReturn) {
        if (responseBodyModel == null) {
          tuple.push("null");
        } else {
          tuple.push(JSON.stringify(responseBodyModel.contentType));
        }
      }

      if (hasServerEntityReturn) {
        if (responseBodyModel == null) {
          tuple.push("undefined");
        } else {
          switch (responseBodyModel.contentType) {
            case "text/plain":
            case "application/json": {
              const mockFunctionName = getMockBodyFunction(names, responseBodyModel);
              assert(mockFunctionName != null);

              tuple.push(`mocks.${mockFunctionName}()`);
              break;
            }

            default:
              throw new Error("unsupported content-type");
          }
        }
      }

      switch (tuple.length) {
        case 0: {
          break;
        }

        case 1: {
          const [value] = tuple as [string];
          yield itt`return ${value};`;
          break;
        }

        default: {
          yield itt`return [${tuple.join(", ")}];`;
        }
      }
    }

    function* generateClientTest() {
      const callMethodFunctionName = getOperationFunctionName(operationModel);
      const functionArguments = new Array<NestedText>();
      const returnArguments = new Array<NestedText>();

      if (hasParametersArgument) {
        functionArguments.push(itt`{${generateRequestParametersMockBody()}}`);
      }

      if (hasContentTypeArgument) {
        functionArguments.push(JSON.stringify(requestBodyModel?.contentType ?? null));
      }

      if (hasEntityArgument) {
        if (requestBodyModel == null) {
          functionArguments.push("undefined");
        } else {
          const mockFunctionName = getMockBodyFunction(names, requestBodyModel);
          assert(mockFunctionName != null);

          const entityExpression = `mocks.${mockFunctionName}()`;
          functionArguments.push(entityExpression);
        }
      }

      functionArguments.push(itt`
        {
          baseUrl,
          validateIncomingParameters: false,
          validateIncomingEntity: false,
          validateOutgoingParameters: false,
          validateOutgoingEntity: false,
          ${generateCredentialsMockContent()}
        }
      `);

      if (hasClientStatusReturn) {
        returnArguments.push("resultStatus");
      }

      if (hasParametersArgument) {
        returnArguments.push("resultParameters");
      }

      if (hasClientContentTypeReturn) {
        returnArguments.push("resultContentType");
      }

      if (hasClientEntityReturn) {
        returnArguments.push("resultEntity");
      }

      switch (returnArguments.length) {
        case 0: {
          yield itt`
            await client.${callMethodFunctionName}(
              ${mapIterable(functionArguments, (item) => itt`${item},\n`)}
            );
          `;
          break;
        }
        case 1: {
          const [returnArgument] = returnArguments as [NestedText];
          yield itt`
            const ${returnArgument} = await client.${callMethodFunctionName}(
              ${mapIterable(functionArguments, (item) => itt`${item},\n`)}
            );
          `;
          break;
        }
        default: {
          yield itt`
            const [
              ${mapIterable(returnArguments, (item) => itt`${item},\n`)}
            ] = await client.${callMethodFunctionName}(
              ${mapIterable(functionArguments, (item) => itt`${item},\n`)}
            );
          `;
          break;
        }
      }

      yield itt`
        assert.ifError(lastError);
      `;

      if (hasClientStatusReturn) {
        yield itt`
          assert.equal(resultStatus, ${JSON.stringify(statusCode)});
        `;
      }

      if (hasClientParametersReturn) {
        for (const parameterModel of operationResultModel.headerParameters) {
          if (!isParameterModelMockable(parameterModel, mockables)) {
            continue;
          }

          const validateFunctionName = getIsParameterFunction(names, parameterModel);
          assert(validateFunctionName != null);

          yield itt`
            {
              const parameterValue = resultParameters.${getParameterMemberName(parameterModel)};
              const valid = validators.${validateFunctionName}(parameterValue);
              assert.equal(valid, true);
            }
          `;
        }
      }

      if (hasClientContentTypeReturn) {
        assert(responseBodyModel != null);

        yield itt`
          assert(resultContentType === ${JSON.stringify(responseBodyModel.contentType)})
        `;
      }

      if (hasClientEntityReturn) {
        if (responseBodyModel == null) {
          yield itt`
            assert.equal(resultEntity, undefined);
          `;
        } else {
          const validateFunctionName = getIsBodyFunction(names, responseBodyModel);
          if (validateFunctionName != null) {
            yield itt`
              { 
                const valid = validators.${validateFunctionName}(resultEntity);
                assert.equal(valid, true);
              }
            `;
          }
        }
      }
    }

    function* generateCredentialsMockContent() {
      for (const authenticationModel of authenticationModels) {
        switch (authenticationModel.type) {
          case "apiKey":
            yield itt`
            ${getAuthenticationMemberName(authenticationModel)}: "super-secret",
          `;
            break;

          case "http":
            switch (authenticationModel.scheme) {
              case "basic":
                yield itt`
                ${getAuthenticationMemberName(authenticationModel)}: {
                  id: "elmerbulthuis",
                  secret: "welkom123",
                },
              `;
                break;

              case "bearer":
                yield itt`
                ${getAuthenticationMemberName(authenticationModel)}: "super-secret",
              `;
                break;

              default: {
                throw "impossible";
              }
            }
            break;

          case "oauth2": {
            // WARN
            break;
          }

          case "openIdConnect": {
            // WARN
            break;
          }

          default: {
            throw "impossible";
          }
        }
      }
    }

    function* generateRequestParametersMockBody() {
      for (const parameterModel of [
        ...operationModel.cookieParameters,
        ...operationModel.headerParameters,
        ...operationModel.pathParameters,
        ...operationModel.queryParameters,
      ]) {
        if (!isParameterModelMockable(parameterModel, mockables)) {
          continue;
        }

        const mockFunctionName = getMockParameterFunction(names, parameterModel);
        assert(mockFunctionName != null);

        yield itt`
        ${getParameterMemberName(parameterModel)}: mocks.${mockFunctionName}(),
      `;
      }
    }

    function* generateResponseParametersMockBody() {
      for (const parameterModel of operationResultModel.headerParameters) {
        if (!isParameterModelMockable(parameterModel, mockables)) {
          continue;
        }

        const mockFunctionName = getMockParameterFunction(names, parameterModel);
        assert(mockFunctionName != null);

        yield itt`
        ${getParameterMemberName(parameterModel)}: mocks.${mockFunctionName}(),
      `;
      }
    }
  }
}
