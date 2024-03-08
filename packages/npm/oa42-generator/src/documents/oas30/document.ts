import * as oas from "@jns42/oas-v3-0";
import assert from "assert";
import { Router } from "goodrouter";
import { NodeLocation } from "jns42-generator";
import { Method, StatusCode, methods, statusCodes } from "oa42-lib";
import * as models from "../../models/index.js";
import { statusKindComparer, takeStatusCodes } from "../../utils/index.js";
import { DocumentBase } from "../document-base.js";

export class Document extends DocumentBase<oas.SchemaDocument> {
  public getApiModel(): models.Api {
    const documentLocation = this.documentLocation;

    const paths = [...this.getPathModels()];
    const authentication = [...this.getAuthenticationModels()];
    const router = new Router<number>();
    for (const pathModel of paths) {
      router.insertRoute(pathModel.id, pathModel.pattern);
    }

    const apiModel: models.Api = {
      location: documentLocation,
      paths,
      authentication,
      router,
      names: this.specification.names,
    };

    return apiModel;
  }

  protected getDefaultSchemaId(): string {
    return "https://spec.openapis.org/oas/3.0/schema/2021-09-28#/definitions/Schema";
  }

  private *getPathModels() {
    if (this.documentNode.paths == null) {
      return;
    }

    let pathIndex = 0;
    for (const pathPattern in this.documentNode.paths) {
      const pathItem = this.documentNode.paths[pathPattern];

      assert(oas.isPathItem(pathItem));

      yield this.getPathModel(
        pathIndex,
        this.documentLocation.pushPointer("paths", pathPattern),
        pathPattern,
        pathItem,
      );

      pathIndex++;
    }
  }

  private getPathModel(
    pathIndex: number,
    pathLocation: NodeLocation,
    pathPattern: string,
    pathItem: oas.PathItem,
  ) {
    const pathModel: models.Path = {
      id: pathIndex + 1,
      location: pathLocation,
      pattern: pathPattern,
      operations: Array.from(this.getOperationModels(pathLocation, pathPattern, pathItem)),
    };

    return pathModel;
  }

  private *getOperationModels(
    pathLocation: NodeLocation,
    pathPattern: string,
    pathItem: oas.PathItem,
  ) {
    for (const method of methods) {
      const operationModel = this.dereference(pathItem[method]);

      if (operationModel == null) {
        continue;
      }

      assert(oas.isOperation(operationModel));

      yield this.getOperationModel(
        pathLocation,
        pathItem,
        pathLocation.pushPointer(method),
        method,
        operationModel,
      );
    }
  }

  private getOperationModel(
    pathLocation: NodeLocation,
    pathItem: oas.PathItem,
    operationLocation: NodeLocation,
    method: Method,
    operationItem: oas.Operation,
  ) {
    const { requestTypes, responseTypes } = this.configuration;

    const allParameters = [
      ...(pathItem.parameters ?? [])
        .map((item) => {
          const parameterObject = this.dereference(item);
          assert(oas.isParameter(parameterObject));

          return parameterObject;
        })
        .map(
          (item, index) =>
            [pathLocation.pushPointer("parameters", String(index)), item.name, item] as const,
        ),
      ...(operationItem.parameters ?? [])
        .map((item) => {
          const parameterObject = this.dereference(item);
          assert(oas.isParameter(parameterObject));

          return parameterObject;
        })
        .map(
          (item, index) =>
            [operationLocation.pushPointer("parameters", String(index)), item.name, item] as const,
        ),
    ];

    const queryParameters = allParameters
      .filter(([, , parameterItem]) => parameterItem.in === "query")
      .map((args) => this.getParameterModel(...args));
    const headerParameters = allParameters
      .filter(([, , parameterItem]) => parameterItem.in === "header")
      .map((args) => this.getParameterModel(...args));
    const pathParameters = allParameters
      .filter(([, , parameterItem]) => parameterItem.in === "path")
      .map((args) => this.getParameterModel(...args));
    const cookieParameters = allParameters
      .filter(([, , parameterItem]) => parameterItem.in === "cookie")
      .map((args) => this.getParameterModel(...args));

    const authenticationRequirements = (
      operationItem.security ??
      this.documentNode.security ??
      []
    ).map((item) =>
      Object.entries(item).map(([authenticationName, scopes]) => ({
        authenticationName,
        scopes,
      })),
    );

    let bodies: models.Body[];
    const requestBody = this.dereference(operationItem.requestBody);
    if (requestBody == null) {
      bodies = [];
    } else {
      assert(oas.isDefinitionsRequestBody(requestBody));
      bodies = [
        ...this.getBodyModels(
          operationLocation.pushPointer("requestBody", "content"),
          requestBody.content,
          requestTypes,
        ),
      ];
    }

    const operationResults = [...this.getOperationResultModels(operationLocation, operationItem)];

    const mockable =
      [...pathParameters, ...headerParameters, ...queryParameters, ...cookieParameters].every(
        (parameterModel) => parameterModel.mockable || !parameterModel.required,
      ) &&
      (operationResults.length == 0 ||
        operationResults.some((operationResultModel) => operationResultModel.mockable));

    const operationModel: models.Operation = {
      location: operationLocation,
      method,
      name: operationItem.operationId ?? "",
      deprecated: operationItem.deprecated ?? false,
      summary: operationItem.summary ?? "",
      description: operationItem.description ?? "",
      pathParameters,
      queryParameters,
      headerParameters,
      cookieParameters,
      authenticationRequirements,
      bodies,
      operationResults,
      mockable,
    };

    return operationModel;
  }

  private *getAuthenticationModels() {
    if (this.documentNode.components?.securitySchemes == null) {
      return;
    }

    for (const authenticationName in this.documentNode.components.securitySchemes) {
      const authenticationItem = this.dereference(
        this.documentNode.components.securitySchemes[authenticationName],
      );

      assert(oas.isSecurityScheme(authenticationItem));

      yield this.getAuthenticationModel(authenticationName, authenticationItem);
    }
  }

  private getAuthenticationModel(
    authenticationName: string,
    authenticationItem: oas.SecurityScheme,
  ) {
    switch (authenticationItem.type) {
      case "apiKey": {
        const authenticationModel: models.ApiKeyAuthentication = {
          name: authenticationName,
          type: "apiKey",
          in: authenticationItem.in,
        };
        return authenticationModel;
      }
      case "http":
        switch (authenticationItem.scheme) {
          case "basic": {
            const authenticationModel: models.HttpBasicAuthentication = {
              name: authenticationName,
              type: "http",
              scheme: "basic",
            };
            return authenticationModel;
          }

          case "bearer": {
            const authenticationModel: models.HttpBearerAuthentication = {
              name: authenticationName,
              type: "http",
              scheme: "bearer",
            };
            return authenticationModel;
          }

          default: {
            throw new Error("http authentication scheme not yet supported");
          }
        }

      case "oauth2": {
        throw new Error("security scheme oauth2 not yet supported");
      }

      case "openIdConnect": {
        throw new Error("security scheme openIdConnect not yet supported");
      }

      default: {
        throw new Error("security scheme not supported");
      }
    }
  }

  private *getOperationResultModels(operationLocation: NodeLocation, operationItem: oas.Operation) {
    const statusCodesAvailable = new Set(statusCodes);
    const statusKinds = Object.keys(operationItem.responses ?? {}).sort(statusKindComparer);

    for (const statusKind of statusKinds) {
      const responseItem = this.dereference(operationItem.responses[statusKind]);

      assert(oas.isResponse(responseItem));

      const statusCodes = [...takeStatusCodes(statusCodesAvailable, statusKind)];

      yield this.getOperationResultModel(
        operationLocation.pushPointer("responses", statusKind),
        statusKind,
        statusCodes,
        responseItem,
      );
    }
  }

  private getOperationResultModel(
    responseLocation: NodeLocation,
    statusKind: string,
    statusCodes: StatusCode[],
    responseItem: oas.Response,
  ): models.OperationResult {
    const { requestTypes, responseTypes } = this.configuration;

    const headerParameters = [
      ...this.getOperationResultHeaderParameters(responseLocation, responseItem),
    ];

    const bodies =
      responseItem.content == null
        ? []
        : [
            ...this.getBodyModels(
              responseLocation.pushPointer("content"),
              responseItem.content,
              responseTypes,
            ),
          ];

    const mockable =
      headerParameters.every(
        (parameterModel) => parameterModel.mockable || !parameterModel.required,
      ) &&
      (bodies.length == 0 || bodies.some((bodyModel) => bodyModel.mockable));

    return {
      location: responseLocation,
      description: responseItem.description,
      statusKind,
      statusCodes,
      headerParameters,
      bodies,
      mockable,
    };
  }

  private *getOperationResultHeaderParameters(
    operationLocation: NodeLocation,
    responseItem: oas.Response,
  ) {
    for (const parameterName in responseItem.headers ?? {}) {
      const headerItem = this.dereference(responseItem.headers![parameterName]);

      assert(oas.isHeader(headerItem));

      yield this.getParameterModel(
        operationLocation.pushPointer("headers", parameterName),
        parameterName,
        headerItem,
      );
    }
  }

  private getParameterModel(
    parameterLocation: NodeLocation,
    parameterName: string,
    parameterItem: oas.Parameter | oas.Header,
  ): models.Parameter {
    const schemaLocation =
      parameterItem.schema == null ? undefined : parameterLocation.pushPointer("schema");
    const schemaId = schemaLocation?.toString();
    const mockable =
      (schemaId != null &&
        this.specification.typesArena.getItem(this.schemaIdMap[schemaId]).mockable) ??
      false;

    return {
      location: parameterLocation,
      name: parameterName,
      required: parameterItem.required ?? false,
      schemaId,
      mockable,
    };
  }

  private *getBodyModels(
    requestBodyLocation: NodeLocation,
    requestBodyItem: oas.RequestBodyContent | oas.ResponseContent,
    contentTypes: string[],
  ) {
    for (const contentType of contentTypes) {
      const mediaTypeItem = requestBodyItem[contentType];
      if (mediaTypeItem == null) {
        continue;
      }

      yield this.getBodyModel(
        requestBodyLocation.pushPointer(contentType),
        contentType,
        mediaTypeItem,
      );
    }
  }
  private getBodyModel(
    mediaTypeLocation: NodeLocation,
    contentType: string,
    mediaTypeItem: oas.MediaType,
  ): models.Body {
    const schemaLocation =
      mediaTypeItem.schema == null ? undefined : mediaTypeLocation.pushPointer("schema");
    const schemaId = schemaLocation?.toString();
    const mockable =
      (schemaId != null &&
        this.specification.typesArena.getItem(this.schemaIdMap[schemaId]).mockable) ??
      false;

    return {
      location: mediaTypeLocation,
      contentType,
      schemaId,
      mockable,
    };
  }

  private dereference(target: unknown | oas.Reference): unknown {
    while (oas.isReference(target)) {
      const refLocation = this.documentLocation.join(NodeLocation.parse(target.$ref as string));
      const refId = refLocation.toString();
      target = this.nodes[refId];
    }
    return target;
  }

  //#region selectors

  protected *selectSchemas(
    pointer: string[],
    document: oas.SchemaDocument,
  ): Iterable<readonly [string[], unknown]> {
    const { requestTypes, responseTypes } = this.configuration;

    yield* selectFromDocument(pointer);

    function* selectFromDocument(pointer: string[]) {
      for (const [path, pathObject] of Object.entries(document.paths)) {
        assert(oas.isPathItem(pathObject));
        yield* selectFromPath([...pointer, "paths", path], pathObject);
      }

      for (const [schema, schemaObject] of Object.entries(document.components?.schemas ?? {})) {
        yield* selectFromSchema([...pointer, "components", "schemas", schema], schemaObject);
      }

      for (const [requestBody, requestBodyObject] of Object.entries(
        document.components?.requestBodies ?? {},
      )) {
        yield* selectFromRequestBody(
          [...pointer, "components", "requestBodies", requestBody],
          requestBodyObject,
        );
      }

      for (const [response, responseObject] of Object.entries(
        document.components?.responses ?? {},
      )) {
        if (oas.isReference(responseObject)) {
          continue;
        }

        yield* selectFromResponse(
          [...pointer, "components", "responses", response],
          responseObject,
        );
      }

      for (const [parameter, parameterObject] of Object.entries(
        document.components?.parameters ?? {},
      )) {
        yield* selectFromParameter(
          [...pointer, "components", "parameters", parameter],
          parameterObject,
        );
      }

      for (const [header, headerObject] of Object.entries(document.components?.headers ?? {})) {
        yield* selectFromHeader([...pointer, "components", "headers", header], headerObject);
      }
    }

    function* selectFromPath(pointer: string[], pathObject: oas.PathItem) {
      for (const [parameter, parameterObject] of Object.entries(pathObject.parameters ?? {})) {
        yield* selectFromParameter([...pointer, "parameters", parameter], parameterObject);
      }

      for (const method of Object.values(methods)) {
        const operationObject = pathObject[method];
        if (operationObject == null) {
          continue;
        }

        assert(oas.isOperation(operationObject));

        yield* selectFromOperation([...pointer, method], operationObject);
      }
    }

    function* selectFromOperation(pointer: string[], operationObject: oas.Operation) {
      if (!oas.isOperation(operationObject)) {
        return;
      }

      for (const [parameter, parameterObject] of Object.entries(operationObject.parameters ?? [])) {
        yield* selectFromParameter([...pointer, "parameters", parameter], parameterObject);
      }

      for (const [response, responseObject] of Object.entries(operationObject.responses ?? {})) {
        if (oas.isReference(responseObject)) {
          continue;
        }

        assert(oas.isResponse(responseObject));

        yield* selectFromResponse([...pointer, "responses", response], responseObject);
      }

      if (operationObject.requestBody) {
        yield* selectFromRequestBody([...pointer, "requestBody"], operationObject.requestBody);
      }
    }

    function* selectFromRequestBody(pointer: string[], requestBodyObject: oas.RequestBodiesAZAZ09) {
      if (oas.isReference(requestBodyObject)) {
        return;
      }

      for (const contentType of requestTypes) {
        const contentObject = requestBodyObject.content[contentType];

        if (contentObject == null) {
          continue;
        }

        yield* selectFromMediaTypeObject([...pointer, "content", contentType], contentObject);
      }
    }

    function* selectFromMediaTypeObject(
      pointer: string[],
      mediaTypeObject: oas.RequestBodyContentAdditionalProperties,
    ) {
      if (oas.isReference(mediaTypeObject)) {
        return;
      }

      yield* selectFromSchema([...pointer, "schema"], mediaTypeObject.schema);
    }

    function* selectFromResponse(responsePointer: string[], responseObject: oas.Response) {
      if (responseObject.content != null) {
        for (const contentType of responseTypes) {
          const contentObject = responseObject.content[contentType];

          if (contentObject == null) {
            continue;
          }

          yield* selectFromSchema(
            [...responsePointer, "content", contentType, "schema"],
            contentObject.schema,
          );
        }
      }

      for (const [header, headerObject] of Object.entries(responseObject.headers ?? {})) {
        yield* selectFromHeader([...responsePointer, "headers", header], headerObject);
      }
    }

    function* selectFromParameter(
      pointer: string[],
      parameterObject: oas.Reference | oas.Parameter,
    ) {
      if (oas.isReference(parameterObject)) return;

      yield* selectFromSchema([...pointer, "schema"], parameterObject.schema);
    }

    function* selectFromHeader(headerPointer: string[], headerObject: oas.Reference | oas.Header) {
      if (oas.isReference(headerObject)) {
        return;
      }

      yield* selectFromSchema([...headerPointer, "schema"], headerObject.schema);
    }

    function* selectFromSchema(
      schemaPointer: string[],
      schemaObject: oas.Reference | oas.DefinitionsSchema | undefined,
    ) {
      if (schemaObject == null) {
        return;
      }

      yield [schemaPointer, schemaObject] as const;
    }
  }

  //#endregion
}
