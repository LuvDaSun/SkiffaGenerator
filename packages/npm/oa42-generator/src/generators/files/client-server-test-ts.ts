import * as core from "@oa42/core";
import assert from "assert";
import * as models from "../../models/index.js";
import { packageInfo } from "../../utils/index.js";
import { itt } from "../../utils/iterable-text-template.js";
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
  apiModelLegacy: models.Api,
  apiModel: core.ApiContainer,
) {
  yield core.banner("//", `v${packageInfo.version}`);

  yield itt`
    import assert from "assert/strict";
    import test from "node:test";
    import * as lib from "oa42-lib";

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
      if (!operationModel.mockable) {
        continue;
      }

      if (operationModel.bodies.length === 0) {
        for (const operationResultModel of operationModel.operationResults) {
          if (!operationResultModel.mockable) {
            continue;
          }

          if (operationResultModel.bodies.length === 0) {
            yield generateOperationTest(
              apiModelLegacy,
              apiModel,
              operationModel,
              null,
              operationResultModel,
              null,
            );
          }
          for (const responseBodyModel of operationResultModel.bodies) {
            if (!responseBodyModel.mockable) {
              continue;
            }

            yield generateOperationTest(
              apiModelLegacy,
              apiModel,
              operationModel,
              null,
              operationResultModel,
              responseBodyModel,
            );
          }
        }
      }
      for (const requestBodyModel of operationModel.bodies) {
        if (!requestBodyModel.mockable) {
          continue;
        }

        for (const operationResultModel of operationModel.operationResults) {
          if (!operationResultModel.mockable) {
            continue;
          }

          if (operationResultModel.bodies.length === 0) {
            yield generateOperationTest(
              apiModelLegacy,
              apiModel,
              operationModel,
              requestBodyModel,
              operationResultModel,
              null,
            );
          }
          for (const responseBodyModel of operationResultModel.bodies) {
            if (!responseBodyModel.mockable) {
              continue;
            }

            yield generateOperationTest(
              apiModelLegacy,
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
  apiModelLegacy: models.Api,
  apiModel: core.ApiContainer,
  operationModel: core.OperationContainer,
  requestBodyModel: core.BodyContainer | null,
  operationResultModel: core.OperationResultContainer,
  responseBodyModel: core.BodyContainer | null,
) {
  const authenticationNames = new Set(
    operationModel.authenticationRequirements.flatMap((group) =>
      group.requirements.map((requirement) => requirement.authenticationName),
    ),
  );
  const authenticationModels = apiModel.authentication.filter((authenticationModel) =>
    authenticationNames.has(authenticationModel.name),
  );

  const { names } = apiModelLegacy;
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
      if (!parameterModel.mockable) {
        continue;
      }

      const validateFunctionName = getIsParameterFunction(apiModelLegacy, parameterModel);
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
          const validateFunctionName = getIsBodyFunction(apiModelLegacy, requestBodyModel);
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
          const mockFunctionName = getMockBodyFunction(apiModelLegacy, responseBodyModel);
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
          const mockFunctionName = getMockBodyFunction(apiModelLegacy, requestBodyModel);
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
      }
    }

    yield itt`
      assert.ifError(lastError);
    `;

    yield itt`
      lib.expectStatus(operationResult, ${JSON.stringify(statusCode)});
    `;

    for (const parameterModel of operationResultModel.headerParameters) {
      if (!parameterModel.mockable) {
        continue;
      }

      const validateFunctionName = getIsParameterFunction(apiModelLegacy, parameterModel);
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
          const validateFunctionName = getIsBodyFunction(apiModelLegacy, responseBodyModel);
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
      if (!parameterModel.mockable) {
        continue;
      }

      const mockFunctionName = getMockParameterFunction(apiModelLegacy, parameterModel);
      assert(mockFunctionName != null);

      yield itt`
        ${getParameterMemberName(parameterModel)}: mocks.${mockFunctionName}(),
      `;
    }
  }

  function* generateResponseParametersMockBody() {
    for (const parameterModel of operationResultModel.headerParameters) {
      if (!parameterModel.mockable) {
        continue;
      }

      const mockFunctionName = getMockParameterFunction(apiModelLegacy, parameterModel);
      assert(mockFunctionName != null);

      yield itt`
        ${getParameterMemberName(parameterModel)}: mocks.${mockFunctionName}(),
      `;
    }
  }
}
