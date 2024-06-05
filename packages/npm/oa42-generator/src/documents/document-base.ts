import * as core from "@oa42/core";
import * as jns42generator from "jns42-generator";
import * as models from "../models/index.js";
import { readNode } from "../utils/index.js";
import { DocumentConfiguration } from "./document-context.js";

export abstract class DocumentBase<N = unknown> {
  protected readonly nodes: Record<string, unknown> = {};
  constructor(
    protected readonly documentLocation: core.NodeLocation,
    protected readonly documentNode: N,
    protected readonly configuration: DocumentConfiguration,
  ) {
    for (const [pointer, node] of readNode([], documentNode)) {
      const nodeLocation = documentLocation.pushPointer(pointer);
      const nodeId = nodeLocation.toString();
      this.nodes[nodeId] = node;
    }
  }

  public getSpecification(): jns42generator.Specification {
    return this.specification;
  }
  public abstract getApiModel(): models.Api;

  protected abstract getDefaultSchemaId(): string;

  protected specification!: jns42generator.Specification;
  protected schemaIdMap!: Record<string, number>;

  //#region selectors

  protected abstract selectSchemas(
    pointer: string[],
    document: N,
  ): Iterable<readonly [string[], unknown]>;

  //#endregion
}
