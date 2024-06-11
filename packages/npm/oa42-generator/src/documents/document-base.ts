import * as oa42Core from "@oa42/core";
import * as jns42generator from "jns42-generator";
import * as models from "../models/index.js";
import { DocumentConfiguration } from "./document-context.js";

export abstract class DocumentBase<N = unknown> {
  protected readonly nodes: Record<string, unknown> = {};
  constructor(
    protected readonly documentLocation: oa42Core.NodeLocation,
    protected readonly documentNode: N,
    protected readonly configuration: DocumentConfiguration,
  ) {}

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
