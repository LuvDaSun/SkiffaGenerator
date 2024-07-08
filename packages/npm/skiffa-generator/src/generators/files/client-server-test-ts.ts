import * as skiffaCore from "@skiffa/core";
import assert from "assert";
import {
  isBodyModelMockable,
  isOperationModelMockable,
  isOperationResultModelMockable,
  isParameterModelMockable,
  packageInfo,
} from "../../utils/index.js";
import { itt } from "../../utils/iterable-text-template.js";
import { selectBodies } from "../helpers.js";
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
} from "../names/index.js";

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
      if (!isOperationModelMockable(operationModel, mockables)) {
        continue;
      }

      const requestBodyModels = selectBodies(operationModel, requestTypes);
      if (requestBodyModels.length === 0) {
        for (const operationResultModel of operationModel.operationResults) {
          if (!isOperationResultModelMockable(operationResultModel, mockables)) {
            continue;
          }

          const responseBodyModels = selectBodies(operationResultModel, responseTypes);

          if (responseBodyModels.length === 0) {
            yield generateOperationTest(
              names,
              mockables,
              apiModel,
              operationModel,
              null,
              operationResultModel,
              null,
            );
          }
          for (const responseBodyModel of responseBodyModels) {
            if (!isBodyModelMockable(responseBodyModel, mockables)) {
              continue;
            }

            yield generateOperationTest(
              names,
              mockables,
              apiModel,
              operationModel,
              null,
              operationResultModel,
              responseBodyModel,
            );
          }
        }
      }
      for (const requestBodyModel of requestBodyModels) {
        if (!isBodyModelMockable(requestBodyModel, mockables)) {
          continue;
        }

        for (const operationResultModel of operationModel.operationResults) {
          if (!isOperationResultModelMockable(operationResultModel, mockables)) {
            continue;
          }

          const responseBodyModels = selectBodies(operationResultModel, responseTypes);

          if (responseBodyModels.length === 0) {
            yield generateOperationTest(
              names,
              mockables,
              apiModel,
              operationModel,
              requestBodyModel,
              operationResultModel,
              null,
            );
          }
          for (const responseBodyModel of responseBodyModels) {
            if (!isBodyModelMockable(responseBodyModel, mockables)) {
              continue;
            }

            yield generateOperationTest(
              names,
              mockables,
              apiModel,
              operationModel,
              requestBodyModel,
              operationResultModel,
              responseBodyModel,
            );
          }
        }
      }
    }
  }
}

function* generateOperationTest(
  names: Record<string, string>,
  mockables: Set<string>,
  apiModel: skiffaCore.ApiContainer,
  operationModel: skiffaCore.OperationContainer,
  requestBodyModel: skiffaCore.BodyContainer | null,
  operationResultModel: skiffaCore.OperationResultContainer,
  responseBodyModel: skiffaCore.BodyContainer | null,
) {
  const authenticationNames = new Set(
    operationModel.authenticationRequirements.flatMap((group) =>
      group.requirements.map((requirement) => requirement.authenticationName),
    ),
  );
  const authenticationModels = apiModel.authentication.filter((authenticationModel) =>
    authenticationNames.has(authenticationModel.name),
  );

  const registerOperationHandlerMethodName = getRegisterOperationHandlerName(operationModel);

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
  // we don't want 1xx or 3xx status codes
  for (statusCode of operationResultModel.statusCodes) {
    if (statusCode >= 200 && statusCode < 300) {
      break;
    }
    if (statusCode >= 400 && statusCode < 500) {
      break;
    }
    if (statusCode >= 500 && statusCode < 600) {
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
              entity: () => ${entityExpression},
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
    if (requestBodyModel == null) {
      yield itt`
        const operationResult = await client.${callMethodFunctionName}(
          {
            contentType: null,
            parameters: {${generateRequestParametersMockBody()}},
          },
          {
            ${generateCredentialsMockContent()}
          },
          {
            baseUrl,
            validateIncomingParameters: false,
            validateIncomingEntity: false,
            validateOutgoingParameters: false,
            validateOutgoingEntity: false,
          },
    );
      `;
    } else {
      switch (requestBodyModel.contentType) {
        case "application/json": {
          const mockFunctionName = getMockBodyFunction(names, requestBodyModel);
          assert(mockFunctionName != null);

          const entityExpression = itt`mocks.${mockFunctionName}()`;

          yield itt`
            const operationResult = await client.${callMethodFunctionName}(
              {
                contentType: ${JSON.stringify(requestBodyModel.contentType)},
                parameters: {${generateRequestParametersMockBody()}},
                entity: () => ${entityExpression},
              },
              {
                ${generateCredentialsMockContent()}
              },
              {
                baseUrl,
                validateIncomingParameters: false,
                validateIncomingEntity: false,
                validateOutgoingParameters: false,
                validateOutgoingEntity: false,
              },
            );
          `;

          break;
        }

        default:
          throw new Error("unsupported content-type");
      }
    }

    yield itt`
      assert.ifError(lastError);
    `;

    yield itt`
      lib.expectStatus(operationResult, ${JSON.stringify(statusCode)});
    `;

    for (const parameterModel of operationResultModel.headerParameters) {
      if (!isParameterModelMockable(parameterModel, mockables)) {
        continue;
      }

      const validateFunctionName = getIsParameterFunction(names, parameterModel);
      assert(validateFunctionName != null);

      yield itt`
        {
          const parameterValue = operationResult.parameters.${getParameterMemberName(parameterModel)};
          const valid = validators.${validateFunctionName}(parameterValue);
          assert.equal(valid, true);
        }
      `;
    }

    if (responseBodyModel != null) {
      yield itt`
        assert(operationResult.contentType === ${JSON.stringify(responseBodyModel.contentType)})
      `;

      switch (responseBodyModel.contentType) {
        case "application/json": {
          const validateFunctionName = getIsBodyFunction(names, responseBodyModel);
          if (validateFunctionName != null) {
            yield itt`
              { 
                const entity = await operationResult.entity();
                const valid = validators.${validateFunctionName}(entity);
                assert.equal(valid, true);
              }
            `;
          }
          break;
        }

        default:
          throw new Error("unsupported content-type");
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
