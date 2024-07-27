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
  const operationResultModels = operationModel.operationResults.filter((operationResultModel) =>
    operationResultModel.statusCodes.some((statusCode) => statusCode >= 200 && statusCode < 300),
  );

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

  const hasStatusReturn = operationResultModels.flatMap((model) => model.statusCodes).length > 1;
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
    for (const operationResultModel of operationResultModels) {
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
      yield itt`
        const apiServer = new server.Server<ApiServerAuthentication>({
          validateIncomingParameters: false,
          validateIncomingEntity: false,
          validateOutgoingParameters: false,
          validateOutgoingEntity: false,
        });
        apiServer.${registerOperationHandlerMethodName}(async (incomingRequest, authentication, accepts) => {
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
          const parameterValue = incomingRequest.parameters.${getParameterMemberName(parameterModel)};
          const valid = validators.${validateFunctionName}(parameterValue);
          assert.equal(valid, true);
        }
      `;
      }

      if (requestBodyModel != null) {
        yield itt`
        assert.equal(incomingRequest.contentType, ${JSON.stringify(requestBodyModel.contentType)})
      `;

        switch (requestBodyModel.contentType) {
          case "application/json": {
            const validateFunctionName = getIsBodyFunction(names, requestBodyModel);
            assert(validateFunctionName != null);

            yield itt`
              {
                const entity = await incomingRequest.entity();
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

      if (responseBodyModel == null) {
        yield itt`
        return {
          status: ${JSON.stringify(statusCode)},
          parameters: {
            ${generateResponseParametersMockBody()}
          },
          contentType: null,
        }
      `;
      } else {
        switch (responseBodyModel.contentType) {
          case "application/json": {
            const mockFunctionName = getMockBodyFunction(names, responseBodyModel);
            assert(mockFunctionName != null);

            const entityExpression = itt`mocks.${mockFunctionName}()`;

            yield itt`
            return {
              status: ${JSON.stringify(statusCode)},
              parameters: {
                ${generateResponseParametersMockBody()}
              },
              contentType: ${JSON.stringify(responseBodyModel.contentType)},
              entity: async () => ${entityExpression},
            }
          `;
            break;
          }

          default:
            throw new Error("unsupported content-type");
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

      if (hasStatusReturn) {
        returnArguments.push("resultStatus");
      }

      if (hasParametersArgument) {
        returnArguments.push("resultParameters");
      }

      if (hasContentTypeReturn) {
        returnArguments.push("resultContentType");
      }

      if (hasEntityReturn) {
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

      if (hasStatusReturn) {
        yield itt`
          assert.equal(resultStatus, ${JSON.stringify(statusCode)});
        `;
      }

      if (hasParametersReturn) {
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

      if (hasContentTypeReturn) {
        assert(responseBodyModel != null);

        yield itt`
          assert(resultContentType === ${JSON.stringify(responseBodyModel.contentType)})
        `;
      }

      if (hasEntityReturn) {
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
