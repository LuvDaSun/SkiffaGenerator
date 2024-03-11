import * as jns42generator from "jns42-generator";
import { NodeLocation } from "jns42-generator";
import * as models from "../models/index.js";
import { readNode } from "../utils/index.js";
import { DocumentConfiguration } from "./document-context.js";

export abstract class DocumentBase<N = unknown> {
  protected readonly nodes: Record<string, unknown> = {};
  constructor(
    protected readonly documentLocation: NodeLocation,
    protected readonly documentNode: N,
    protected readonly configuration: DocumentConfiguration,
  ) {
    for (const [pointer, node] of readNode([], documentNode)) {
      const nodeLocation = documentLocation.pushPointer(...pointer);
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
  public async load() {
    const { defaultTypeName, nameMaximumIterations, transformMaximumIterations } =
      this.configuration;

    const schemas = Object.fromEntries(await this.getSchemas());

    const document = {
      $schema: "https://schema.JsonSchema42.org/jns42-intermediate/schema.json" as const,
      schemas,
    };
    const specification = jns42generator.loadSpecification(document, {
      defaultTypeName,
      nameMaximumIterations,
      transformMaximumIterations,
    });

    const schemaIdMap: Record<string, number> = {};
    for (const [key, model] of [...specification.typesArena].map(
      (item, key) => [key, item] as const,
    )) {
      if (model.id == null) {
        continue;
      }

      schemaIdMap[model.id] = key;
    }

    this.specification = specification;
    this.schemaIdMap = schemaIdMap;
  }

  private async getSchemas(): Promise<Iterable<readonly [string, any]>> {
    const documentContext = new jns42generator.DocumentContext();

    documentContext.registerFactory(
      jns42generator.schemaDraft202012.metaSchemaId,
      ({ retrievalLocation, givenLocation, antecedentLocation, documentNode: rootNode }) =>
        new jns42generator.schemaDraft04.Document(
          retrievalLocation,
          givenLocation,
          antecedentLocation,
          rootNode,
          documentContext,
        ),
    );
    documentContext.registerFactory(
      jns42generator.schemaDraft04.metaSchemaId,
      ({ retrievalLocation, givenLocation, antecedentLocation, documentNode: rootNode }) =>
        new jns42generator.schemaDraft04.Document(
          retrievalLocation,
          givenLocation,
          antecedentLocation,
          rootNode,
          documentContext,
        ),
    );
    documentContext.registerFactory(
      jns42generator.schemaOasV31.metaSchemaId,
      ({ retrievalLocation, givenLocation, antecedentLocation, documentNode: rootNode }) =>
        new jns42generator.schemaDraft04.Document(
          retrievalLocation,
          givenLocation,
          antecedentLocation,
          rootNode,
          documentContext,
        ),
    );
    documentContext.registerFactory(
      jns42generator.oasV30.metaSchemaId,
      ({ retrievalLocation, givenLocation, antecedentLocation, documentNode: rootNode }) =>
        new jns42generator.schemaDraft04.Document(
          retrievalLocation,
          givenLocation,
          antecedentLocation,
          rootNode,
          documentContext,
        ),
    );
    documentContext.registerFactory(
      jns42generator.swaggerV2.metaSchemaId,
      ({ retrievalLocation, givenLocation, antecedentLocation, documentNode: rootNode }) =>
        new jns42generator.schemaDraft04.Document(
          retrievalLocation,
          givenLocation,
          antecedentLocation,
          rootNode,
          documentContext,
        ),
    );

    for (const [pointer, schemaNode] of this.selectSchemas([], this.documentNode)) {
      const nodeLocation = this.documentLocation.pushPointer(...pointer);
      await documentContext.loadFromDocument(
        nodeLocation,
        nodeLocation,
        this.documentLocation,
        this.documentNode,
        this.getDefaultSchemaId(),
      );
    }

    return documentContext.getIntermediateSchemaEntries();
  }

  //#region selectors

  protected abstract selectSchemas(
    pointer: string[],
    document: N,
  ): Iterable<readonly [string[], unknown]>;

  //#endregion
}
