import assert from "assert";
import { Router } from "goodrouter";
import { Method, StatusCode, methods, statusCodes } from "oa42-lib";
import * as oas from "schema-oas-v3-0";
import * as models from "../../models/index.js";
import {
  appendToPointer,
  appendToUriHash,
  normalizeUrl,
  statusKindComparer,
  takeStatusCodes,
} from "../../utils/index.js";
import { DocumentBase } from "../document-base.js";

export class Document extends DocumentBase<oas.SchemaDocument> {
  public getApiModel(): models.Api {
    const uri = this.documentUri;

    const paths = [...this.getPathModels()];
    const authentication = [...this.getAuthenticationModels()];
    const router = new Router<number>();
    for (const pathModel of paths) {
      router.insertRoute(pathModel.id, pathModel.pattern);
    }

    const apiModel: models.Api = {
      uri,
      paths,
      authentication,
      router,
      names: this.specification.names,
    };

    return apiModel;
  }

  private *getPathModels() {
    if (this.documentNode.paths == null) {
      return;
    }

    let pathIndex = 0;
    for (const pathPattern in this.documentNode.paths) {
      const pathItem = this.documentNode.paths[pathPattern];

      if (oas.isPathItem(pathItem)) {
        yield this.getPathModel(
          pathIndex,
          appendToUriHash(this.documentUri, "paths", pathPattern),
          pathPattern,
          pathItem,
        );
      }
      pathIndex++;
    }
  }

  private getPathModel(
    pathIndex: number,
    pathUri: URL,
    pathPattern: string,
    pathItem: oas.PathItem,
  ) {
    const pathModel: models.Path = {
      id: pathIndex + 1,
      uri: pathUri,
      pattern: pathPattern,
      operations: Array.from(this.getOperationModels(pathUri, pathPattern, pathItem)),
    };

    return pathModel;
  }

  private *getOperationModels(pathUri: URL, pathPattern: string, pathItem: oas.PathItem) {
    for (const method of methods) {
      const operationModel = this.dereference(pathItem[method]);

      if (operationModel == null) {
        continue;
      }

      assert(oas.isOperation(operationModel));

      yield this.getOperationModel(
        pathUri,
        pathItem,
        appendToUriHash(pathUri, method),
        method,
        operationModel,
      );
    }
  }

  private getOperationModel(
    pathUri: URL,
    pathItem: oas.PathItem,
    operationUri: URL,
    method: Method,
    operationItem: oas.Operation,
  ) {
    const allParameters = [
      ...(pathItem.parameters ?? [])
        .map((item) => {
          const parameterObject = this.dereference(item);
          assert(oas.isParameter(parameterObject));

          return parameterObject;
        })
        .map(
          (item, index) =>
            [appendToUriHash(pathUri, "parameters", index), item.name, item] as const,
        ),
      ...(operationItem.parameters ?? [])
        .map((item) => {
          const parameterObject = this.dereference(item);
          assert(oas.isParameter(parameterObject));

          return parameterObject;
        })
        .map(
          (item, index) =>
            [appendToUriHash(operationUri, "parameters", index), item.name, item] as const,
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
          appendToUriHash(operationUri, "requestBody", "content"),
          requestBody.content,
        ),
      ];
    }

    const operationResults = [...this.getOperationResultModels(operationUri, operationItem)];

    const mockable =
      [...pathParameters, ...headerParameters, ...queryParameters, ...cookieParameters].every(
        (parameterModel) => parameterModel.mockable || !parameterModel.required,
      ) && operationResults.some((operationResultModel) => operationResultModel.mockable);

    const operationModel: models.Operation = {
      uri: operationUri,
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
      const authenticationItem = this.documentNode.components.securitySchemes[authenticationName];

      if (!oas.isSecurityScheme(authenticationItem)) {
        continue;
      }

      yield this.getAuthenticationModel(authenticationName, authenticationItem);
    }
  }

  private getAuthenticationModel(
    authenticationName: string,
    authenticationItem: oas.SecurityScheme,
  ) {
    const authenticationModel: models.Authentication = {
      name: authenticationName,
    };
    return authenticationModel;
  }

  private *getOperationResultModels(operationUri: URL, operationItem: oas.Operation) {
    const statusCodesAvailable = new Set(statusCodes);
    const statusKinds = Object.keys(operationItem.responses ?? {}).sort(statusKindComparer);

    for (const statusKind of statusKinds) {
      const responseItem = operationItem.responses[statusKind];

      if (!oas.isResponse(responseItem)) {
        continue;
      }

      const statusCodes = [...takeStatusCodes(statusCodesAvailable, statusKind)];

      yield this.getOperationResultModel(
        appendToUriHash(operationUri, "responses", statusKind),
        statusKind,
        statusCodes,
        responseItem,
      );
    }
  }

  private getOperationResultModel(
    responseUri: URL,
    statusKind: string,
    statusCodes: StatusCode[],
    responseItem: oas.Response,
  ): models.OperationResult {
    const headerParameters = [
      ...this.getOperationResultHeaderParameters(responseUri, responseItem),
    ];

    const bodies = oas.isResponseContent(responseItem.content)
      ? [...this.getBodyModels(appendToUriHash(responseUri, "content"), responseItem.content)]
      : [];

    const mockable =
      headerParameters.every(
        (parameterModel) => parameterModel.mockable || !parameterModel.required,
      ) && bodies.some((bodyModel) => bodyModel.mockable);

    return {
      uri: responseUri,
      description: responseItem.description,
      statusKind,
      statusCodes,
      headerParameters,
      bodies,
      mockable,
    };
  }

  private *getOperationResultHeaderParameters(operationUri: URL, responseItem: oas.Response) {
    for (const parameterName in responseItem.headers ?? {}) {
      const headerItem = responseItem.headers![parameterName];
      if (!oas.isHeader(headerItem)) {
        continue;
      }

      yield this.getParameterModel(
        appendToUriHash(operationUri, "headers", parameterName),
        parameterName,
        headerItem,
      );
    }
  }

  private getParameterModel(
    parameterUri: URL,
    parameterName: string,
    parameterItem: oas.Parameter | oas.Header,
  ): models.Parameter {
    const schemaUri =
      parameterItem.schema == null ? undefined : appendToUriHash(parameterUri, "schema");
    const schemaId = schemaUri == null ? schemaUri : normalizeUrl(schemaUri).toString();
    const mockable =
      (schemaId != null &&
        this.specification.typesArena.getItem(this.schemaIdMap[schemaId]).mockable) ??
      false;

    return {
      uri: parameterUri,
      name: parameterName,
      required: parameterItem.required ?? false,
      schemaId,
      mockable,
    };
  }

  private *getBodyModels(
    requestBodyUri: URL,
    requestBodyItem: oas.RequestBodyContent | oas.ResponseContent,
  ) {
    for (const contentType in requestBodyItem) {
      const mediaTypeItem = requestBodyItem[contentType];

      if (!oas.isMediaType(mediaTypeItem)) {
        continue;
      }

      yield this.getBodyModel(
        appendToUriHash(requestBodyUri, contentType),
        contentType,
        mediaTypeItem,
      );
    }
  }
  private getBodyModel(
    mediaTypeUri: URL,
    contentType: string,
    mediaTypeItem: oas.MediaType,
  ): models.Body {
    const schemaUri =
      mediaTypeItem.schema == null ? undefined : appendToUriHash(mediaTypeUri, "schema");
    const schemaId = schemaUri == null ? schemaUri : normalizeUrl(schemaUri).toString();
    const mockable =
      (schemaId != null &&
        this.specification.typesArena.getItem(this.schemaIdMap[schemaId]).mockable) ??
      false;

    return {
      uri: mediaTypeUri,
      contentType,
      schemaId,
      mockable,
    };
  }

  private dereference(target: unknown | oas.Reference): unknown {
    while (oas.isReference(target)) {
      const pointer = (target.$ref as string).replace(/^#+/, "");
      target = this.nodes[pointer];
    }
    return target;
  }

  //#region selectors

  protected *selectSchemas(
    pointer: string,
    document: oas.SchemaDocument,
  ): Iterable<readonly [string, unknown]> {
    yield* selectFromDocument(pointer);

    function* selectFromDocument(pointer: string) {
      for (const [path, pathObject] of Object.entries(document.paths)) {
        assert(oas.isPathItem(pathObject));
        yield* selectFromPath(appendToPointer(pointer, "paths", path), pathObject);
      }

      for (const [schema, schemaObject] of Object.entries(document.components?.schemas ?? {})) {
        yield* selectFromSchema(
          appendToPointer(pointer, "components", "schemas", schema),
          schemaObject,
        );
      }

      for (const [requestBody, requestBodyObject] of Object.entries(
        document.components?.requestBodies ?? {},
      )) {
        yield* selectFromRequestBody(
          appendToPointer(pointer, "components", "requestBodies", requestBody),
          requestBodyObject,
        );
      }

      for (const [response, responseObject] of Object.entries(
        document.components?.responses ?? {},
      )) {
        if (oas.isReference(responseObject)) {
          throw "TODO";
        }

        yield* selectFromResponse(
          appendToPointer(pointer, "components", "responses", response),
          responseObject,
        );
      }

      for (const [parameter, parameterObject] of Object.entries(
        document.components?.parameters ?? {},
      )) {
        yield* selectFromParameter(
          appendToPointer(pointer, "components", "parameters", parameter),
          parameterObject,
        );
      }

      for (const [header, headerObject] of Object.entries(document.components?.headers ?? {})) {
        yield* selectFromHeader(
          appendToPointer(pointer, "components", "headers", header),
          headerObject,
        );
      }
    }

    function* selectFromPath(pointer: string, pathObject: oas.PathItem) {
      for (const [parameter, parameterObject] of Object.entries(pathObject.parameters ?? {})) {
        yield* selectFromParameter(
          appendToPointer(pointer, "parameters", parameter),
          parameterObject,
        );
      }

      for (const method of Object.values(methods)) {
        const operationObject = pathObject[method];
        if (operationObject == null) {
          continue;
        }

        assert(oas.isOperation(operationObject));

        yield* selectFromOperation(appendToPointer(pointer, method), operationObject);
      }
    }

    function* selectFromOperation(pointer: string, operationObject: oas.Operation) {
      if (!oas.isOperation(operationObject)) {
        return;
      }

      for (const [parameter, parameterObject] of Object.entries(operationObject.parameters ?? [])) {
        yield* selectFromParameter(
          appendToPointer(pointer, "parameters", parameter),
          parameterObject,
        );
      }

      for (const [response, responseObject] of Object.entries(operationObject.responses ?? {})) {
        if (oas.isReference(responseObject)) {
          throw "TODO";
        }

        assert(oas.isResponse(responseObject));

        yield* selectFromResponse(appendToPointer(pointer, "responses", response), responseObject);
      }

      if (operationObject.requestBody) {
        yield* selectFromRequestBody(
          appendToPointer(pointer, "requestBody"),
          operationObject.requestBody,
        );
      }
    }

    function* selectFromRequestBody(pointer: string, requestBodyObject: oas.RequestBodiesAZAZ09) {
      if (oas.isReference(requestBodyObject)) {
        return;
      }

      for (const [contentType, contentObject] of Object.entries(requestBodyObject.content)) {
        yield* selectFromMediaTypeObject(
          appendToPointer(pointer, "content", contentType),
          contentObject,
        );
      }
    }

    function* selectFromMediaTypeObject(
      pointer: string,
      mediaTypeObject: oas.RequestBodyContentAdditionalProperties,
    ) {
      if (oas.isReference(mediaTypeObject)) {
        return;
      }

      yield* selectFromSchema(appendToPointer(pointer, "schema"), mediaTypeObject.schema);
    }

    function* selectFromResponse(responsePointer: string, responseObject: oas.Response) {
      for (const [contentType, contentObject] of Object.entries(responseObject.content ?? {})) {
        yield* selectFromSchema(
          appendToPointer(responsePointer, "content", contentType, "schema"),
          contentObject.schema,
        );
      }

      for (const [header, headerObject] of Object.entries(responseObject.headers ?? {})) {
        yield* selectFromHeader(appendToPointer(responsePointer, "headers", header), headerObject);
      }
    }

    function* selectFromParameter(pointer: string, parameterObject: oas.Reference | oas.Parameter) {
      if (oas.isReference(parameterObject)) return;

      yield* selectFromSchema(appendToPointer(pointer, "schema"), parameterObject.schema);
    }

    function* selectFromHeader(headerPointer: string, headerObject: oas.Reference | oas.Header) {
      if (oas.isReference(headerObject)) {
        return;
      }

      yield* selectFromSchema(appendToPointer(headerPointer, "schema"), headerObject.schema);
    }

    function* selectFromSchema(
      schemaPointer: string,
      schemaObject: oas.Reference | oas.DefinitionsSchema | undefined,
    ) {
      if (schemaObject == null) {
        return;
      }

      yield [schemaPointer, schemaObject] as const;
    }

    // function* selectFromSchema(
    //   schemaObject:
    //     | oas.Reference
    //     | oas.SchemaObject
    //     | undefined,
    //   pointer: string,
    // ): Iterable<{
    //   schemaObject: oas.SchemaObject;
    //   pointerParts: string[];
    // }> {
    //   if (!schemaObject) return;
    //   if (oas.isReference(schemaObject)) return;

    //   yield {
    //     schemaObject,
    //     pointerParts,
    //   };

    //   for (const [property, propertyObject] of Object.entries(
    //     schemaObject.properties ?? {},
    //   )) {
    //     yield* selectFromSchema(propertyObject, [
    //       ...pointerParts,
    //       "properties",
    //       property,
    //     ]);
    //   }

    //   for (const [allOf, allOfObject] of Object.entries(
    //     schemaObject.allOf ?? {},
    //   )) {
    //     yield* selectFromSchema(allOfObject, [...pointerParts, "allOf", allOf]);
    //   }

    //   for (const [anyOf, anyOfObject] of Object.entries(
    //     schemaObject.anyOf ?? {},
    //   )) {
    //     yield* selectFromSchema(anyOfObject, [...pointerParts, "anyOf", anyOf]);
    //   }

    //   for (const [oneOf, oneOfObject] of Object.entries(
    //     schemaObject.oneOf ?? {},
    //   )) {
    //     yield* selectFromSchema(oneOfObject, [...pointerParts, "oneOf", oneOf]);
    //   }

    //   if ("items" in schemaObject) {
    //     if (Array.isArray(schemaObject.items)) {
    //       for (const [item, itemObject] of Object.entries(schemaObject.items)) {
    //         yield* selectFromSchema(itemObject, [...pointerParts, "items", item]);
    //       }
    //     } else {
    //       yield* selectFromSchema(schemaObject.items, [...pointerParts, "items"]);
    //     }
    //   }

    //   if (typeof schemaObject.additionalProperties === "object") {
    //     yield* selectFromSchema(schemaObject.additionalProperties, [
    //       ...pointerParts,
    //       "additionalProperties",
    //     ]);
    //   }

    //   yield* selectFromSchema(schemaObject.not, [...pointerParts, "not"]);
    // }
  }

  //#endregion
}
