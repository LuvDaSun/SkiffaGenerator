import { banner } from "@oa42/core";
import assert from "assert";
import * as models from "../../models/index.js";
import { packageInfo, toCamel } from "../../utils/index.js";
import { NestedText, itt } from "../../utils/iterable-text-template.js";
import { getServerAuthenticationTypeName } from "../names/index.js";

export function* generateClientServerTestTsCode(apiModel: models.Api) {
  yield banner("//", `v${packageInfo.version}`);

  yield itt`
    import assert from "assert/strict";
    import test from "node:test";
    import * as main from "./main.js";
    import * as http from "http";
  `;

  {
    // TODO move to function
    const typeName = getServerAuthenticationTypeName();

    yield itt`
    type ${typeName} = {
      ${apiModel.authentication.map((authenticationModel) => itt`${toCamel(authenticationModel.name)}: boolean,`)}
    };
  `;
  }

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
            yield generateOperationTest(apiModel, operationModel, null, operationResultModel, null);
          }
          for (const responseBodyModel of operationResultModel.bodies) {
            if (!responseBodyModel.mockable) {
              continue;
            }

            yield generateOperationTest(
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
  apiModel: models.Api,
  operationModel: models.Operation,
  requestBodyModel: models.Body | null,
  operationResultModel: models.OperationResult,
  responseBodyModel: models.Body | null,
) {
  const authenticationNames = new Set(
    operationModel.authenticationRequirements.flatMap((requirements) =>
      requirements.map((requirement) => requirement.authenticationName),
    ),
  );
  const authenticationModels = apiModel.authentication.filter((authenticationModel) =>
    authenticationNames.has(authenticationModel.name),
  );

  const { names } = apiModel;
  const registerOperationHandlerMethodName = toCamel("register", operationModel.name, "operation");

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
    const serverAuthenticationName = getServerAuthenticationTypeName();

    yield itt`
      const server = new main.Server<${serverAuthenticationName}>({
        validateIncomingParameters: false,
        validateIncomingEntity: false,
        validateOutgoingParameters: false,
        validateOutgoingEntity: false,
      });
      server.${registerOperationHandlerMethodName}(async (incomingRequest, authentication, accepts) => {
        ${generateServerOperationHandler()}
      });
    `;
    for (const authenticationModel of authenticationModels) {
      const registerAuthenticationHandlerMethodName = toCamel(
        "register",
        authenticationModel.name,
        "authentication",
      );
      switch (authenticationModel.type) {
        case "apiKey":
          yield itt`
            server.${registerAuthenticationHandlerMethodName}(
              async (credential) => credential === "super-secret-api-key"
            )
          `;
          break;
        case "http":
          switch (authenticationModel.scheme) {
            case "basic":
              yield itt`
                server.${registerAuthenticationHandlerMethodName}(
                  async (credential) =>
                    credential.id === "elmerbulthuis" && credential.secret === "welkom123"
                )
              `;
              break;

            case "bearer":
              yield itt`
                server.${registerAuthenticationHandlerMethodName}(
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
      const httpServer = http.createServer();
      httpServer.addListener(
        "request",
        server.asHttpRequestListener(),
      );
      await new Promise<void>((resolve) => httpServer.listen(resolve));
      const address = httpServer.address();
      assert(address != null && typeof address === "object")
      const { port } = address;
      const baseUrl = new URL(\`http://localhost:\${port}\`);
    `;
    yield itt`
      try {
        ${generateClientTest()}
      }
      finally {
        await new Promise<void>((resolve, reject) =>
          httpServer.close((error) => (error == null ? resolve() : reject(error))),
        );
      }
    `;
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

      assert(parameterModel.schemaId != null);

      const validateFunctionName = toCamel("is", names[parameterModel.schemaId]);

      yield itt`
        {
          const parameterValue = incomingRequest.parameters.${toCamel(parameterModel.name)};
          const valid = main.${validateFunctionName}(parameterValue);
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
          assert(requestBodyModel.schemaId != null);

          const validateFunctionName = toCamel("is", names[requestBodyModel.schemaId]);

          yield itt`
              {
                const entity = await incomingRequest.entity();
                const valid = main.${validateFunctionName}(entity);
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
          assert(responseBodyModel.schemaId != null);

          let entityExpression: NestedText;
          const mockFunctionName = toCamel("mock", names[responseBodyModel.schemaId]);
          entityExpression = itt`main.${mockFunctionName}()`;

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
    const callMethodFunctionName = toCamel(operationModel.name);
    if (requestBodyModel == null) {
      yield itt`
        const operationResult = await main.${callMethodFunctionName}(
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
          assert(requestBodyModel.schemaId != null);

          let entityExpression: NestedText;

          const mockFunctionName = toCamel("mock", names[requestBodyModel.schemaId]);
          entityExpression = itt`main.${mockFunctionName}()`;

          yield itt`
            const operationResult = await main.${callMethodFunctionName}(
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
      assert(operationResult.status === ${JSON.stringify(statusCode)})
    `;

    for (const parameterModel of operationResultModel.headerParameters) {
      if (!parameterModel.mockable) {
        continue;
      }

      assert(parameterModel.schemaId != null);

      const validateFunctionName = toCamel("is", names[parameterModel.schemaId]);

      yield itt`
        {
          const parameterValue = operationResult.parameters.${toCamel(parameterModel.name)};
          const valid = main.${validateFunctionName}(parameterValue);
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
          if (responseBodyModel.schemaId != null) {
            const validateFunctionName = toCamel("is", names[responseBodyModel.schemaId]);
            yield itt`
              { 
                const entity = await operationResult.entity();
                const valid = main.${validateFunctionName}(entity);
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
            ${toCamel(authenticationModel.name)}: "super-secret",
          `;
          break;

        case "http":
          switch (authenticationModel.scheme) {
            case "basic":
              yield itt`
                ${toCamel(authenticationModel.name)}: {
                  id: "elmerbulthuis",
                  secret: "welkom123",
                },
              `;
              break;

            case "bearer":
              yield itt`
                ${toCamel(authenticationModel.name)}: "super-secret",
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

      assert(parameterModel.schemaId != null);

      const mockFunctionName = toCamel("mock", names[parameterModel.schemaId]);
      yield itt`
        ${toCamel(parameterModel.name)}: main.${mockFunctionName}(),
      `;
    }
  }

  function* generateResponseParametersMockBody() {
    for (const parameterModel of operationResultModel.headerParameters) {
      if (!parameterModel.mockable) {
        continue;
      }

      assert(parameterModel.schemaId != null);

      const mockFunctionName = toCamel("mock", names[parameterModel.schemaId]);
      yield itt`
        ${toCamel(parameterModel.name)}: main.${mockFunctionName}(),
      `;
    }
  }
}
