import assert from "assert";
import * as models from "../../models/index.js";
import { banner, toCamel } from "../../utils/index.js";
import { itt } from "../../utils/iterable-text-template.js";

export function* generateClientServerTestTsCode(apiModel: models.Api) {
  yield banner;

  yield itt`
    import assert from "assert/strict";
    import test from "node:test";
    import * as main from "./main.js";
    import * as http from "http";
  `;

  for (const pathModel of apiModel.paths) {
    for (const operationModel of pathModel.operations) {
      if (operationModel.bodies.length === 0) {
        for (const operationResultModel of operationModel.operationResults) {
          if (operationResultModel.bodies.length === 0) {
            yield generateOperationTest(apiModel, operationModel, null, operationResultModel, null);
          }
          for (const responseBodyModel of operationResultModel.bodies) {
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
        for (const operationResultModel of operationModel.operationResults) {
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
  const { names } = apiModel;
  const registerHandlerMethodName = toCamel("register", operationModel.name, "operation");

  let testNameParts = new Array<string>();
  testNameParts.push(operationModel.name);
  if (requestBodyModel != null) {
    testNameParts.push(requestBodyModel.contentType);
  }
  testNameParts.push(operationResultModel.statusKind);
  if (responseBodyModel != null) {
    testNameParts.push(responseBodyModel.contentType);
  }

  yield itt`
    test(${JSON.stringify(testNameParts.join(" "))}, async () => {
      ${generateTestBody()}
    });
  `;

  function* generateTestBody() {
    if (
      requestBodyModel != null &&
      !(requestBodyModel.schemaId != null && requestBodyModel.contentType === "application/json")
    ) {
      return;
    }

    if (
      responseBodyModel != null &&
      !(responseBodyModel.schemaId != null && responseBodyModel.contentType === "application/json")
    ) {
      return;
    }

    yield itt`
      const server = new main.Server({
        validateIncomingParameters: false,
        validateIncomingEntity: false,
        validateOutgoingParameters: false,
        validateOutgoingEntity: false,
      });
      server.${registerHandlerMethodName}(async (incomingRequest, authentication) => {
        ${generateServerOperationHandler()}
      });
    `;
    yield itt`
      let lastError: unknown;
      const httpServer = http.createServer();
      httpServer.addListener(
        "request",
        server.asRequestListener({
          onError: (error) => lastError = error,
        }),
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
      if (parameterModel.schemaId == null) {
        continue;
      }

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
      assert(requestBodyModel.schemaId != null);

      const validateFunctionName = toCamel("is", names[requestBodyModel.schemaId]);

      yield itt`
        assert.equal(incomingRequest.contentType, ${JSON.stringify(requestBodyModel.contentType)})
      `;

      yield itt`
        {
          const entity = await incomingRequest.entity();
          const valid = main.${validateFunctionName}(entity);
          assert.equal(valid, true);
        }
      `;
    }

    if (responseBodyModel == null) {
      yield itt`
        return {
          status: ${JSON.stringify(operationResultModel.statusCodes[0])},
          parameters: {
            ${generateResponseParametersMockBody()}
          },
          contentType: null,
        }
      `;
    } else {
      assert(responseBodyModel.schemaId != null);

      const mockFunctionName = toCamel("mock", names[responseBodyModel.schemaId]);

      yield itt`
        return {
          status: ${JSON.stringify(operationResultModel.statusCodes[0])},
          parameters: {
            ${generateResponseParametersMockBody()}
          },
          contentType: ${JSON.stringify(responseBodyModel.contentType)},
          entity: () => main.${mockFunctionName}(),
        }
      `;
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
          {},
        );
      `;
    } else {
      assert(requestBodyModel.schemaId != null);

      const mockFunctionName = toCamel("mock", names[requestBodyModel.schemaId]);

      yield itt`
        const operationResult = await main.${callMethodFunctionName}(
          {
            contentType: ${JSON.stringify(requestBodyModel.contentType)},
            parameters: {${generateRequestParametersMockBody()}},
            entity: () => main.${mockFunctionName}(),
          },
          {},
          {
            baseUrl,
            validateIncomingParameters: false,
            validateIncomingEntity: false,
            validateOutgoingParameters: false,
            validateOutgoingEntity: false,
          },
        );
      `;
    }

    yield itt`
      assert.ifError(lastError);
    `;

    yield itt`
      assert(operationResult.status === ${JSON.stringify(operationResultModel.statusCodes[0])})
    `;

    for (const parameterModel of operationResultModel.headerParameters) {
      if (parameterModel.schemaId == null) {
        continue;
      }

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
      assert(responseBodyModel.schemaId != null);

      const validateFunctionName = toCamel("is", names[responseBodyModel.schemaId]);

      yield itt`
        assert(operationResult.contentType === ${JSON.stringify(responseBodyModel.contentType)})
      `;

      yield itt`
        { 
          const entity = await operationResult.entity();
          const valid = main.${validateFunctionName}(entity);
          assert.equal(valid, true);
        }
      `;
    }
  }

  function* generateRequestParametersMockBody() {
    for (const parameterModel of [
      ...operationModel.cookieParameters,
      ...operationModel.headerParameters,
      ...operationModel.pathParameters,
      ...operationModel.queryParameters,
    ]) {
      if (parameterModel.schemaId == null) {
        continue;
      }

      const mockFunctionName = toCamel("mock", names[parameterModel.schemaId]);
      yield itt`
        ${toCamel(parameterModel.name)}: main.${mockFunctionName}(),
      `;
    }
  }

  function* generateResponseParametersMockBody() {
    for (const parameterModel of operationResultModel.headerParameters) {
      if (parameterModel.schemaId == null) {
        continue;
      }

      const mockFunctionName = toCamel("mock", names[parameterModel.schemaId]);
      yield itt`
        ${toCamel(parameterModel.name)}: main.${mockFunctionName}(),
      `;
    }
  }
}
