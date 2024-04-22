import * as jns42core from "@jns42/core";
import * as jns42generator from "jns42-generator";
import * as models from "../models/index.js";
import { readNode } from "../utils/index.js";
import { DocumentConfiguration } from "./document-context.js";

export abstract class DocumentBase<N = unknown> {
  protected readonly nodes: Record<string, unknown> = {};
  constructor(
    protected readonly documentLocation: jns42core.NodeLocation,
    protected readonly documentNode: N,
    protected readonly configuration: DocumentConfiguration,
  ) {
    for (const [pointer, node] of readNode([], documentNode)) {
      const nodeLocation = documentLocation.pushPointer(pointer);
      const nodeId = nodeLocation.toString();
      this.nodes[nodeId] = node;
    }
  }

  [Symbol.dispose]() {
    this.specification?.[Symbol.dispose]();
  }

  public getSpecification(): jns42generator.Specification {
    return this.specification;
  }
  public abstract getApiModel(): models.Api;

  protected abstract getDefaultSchemaId(): string;

  protected specification!: jns42generator.Specification;
  protected schemaIdMap!: Record<string, number>;
  public async load() {
    const { defaultTypeName, transformMaximumIterations } = this.configuration;

    const documentContext = jns42core.DocumentContext.new();
    documentContext.registerWellKnownFactories();

    for (const [pointer, schemaNode] of this.selectSchemas([], this.documentNode)) {
      const nodeLocation = this.documentLocation.pushPointer(pointer);
      await documentContext.loadFromNode(
        nodeLocation.toString(),
        nodeLocation.toString(),
        this.documentLocation.toString(),
        schemaNode,
        this.getDefaultSchemaId(),
      );
      const s = documentContext.getSchemaNodes();
    }

    const specification = jns42generator.loadSpecification(documentContext, {
      defaultTypeName,
      transformMaximumIterations,
    });

    const schemaIdMap: Record<string, number> = {};
    for (const [key, model] of [...specification.typesArena].map(
      (item, key) => [key, item] as const,
    )) {
      if (model.location == null) {
        continue;
      }

      schemaIdMap[model.location] = key;
    }

    this.specification = specification;
    this.schemaIdMap = schemaIdMap;
  }

  //#region selectors

  protected abstract selectSchemas(
    pointer: string[],
    document: N,
  ): Iterable<readonly [string[], unknown]>;

  //#endregion
}
