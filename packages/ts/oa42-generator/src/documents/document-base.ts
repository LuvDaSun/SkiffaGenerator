import * as jns42generator from "jns42-generator";
import { Specification } from "jns42-generator";
import * as models from "../models/index.js";
import { DocumentOptions } from "./document-context.js";

export abstract class DocumentBase<N = unknown> {
  constructor(
    protected readonly documentUri: URL,
    protected readonly documentNode: N,
    protected readonly options: DocumentOptions,
  ) {
    //
  }

  protected specification!: Specification;
  public async loadSpecification() {
    const { defaultName, nameMaximumIterations, transformMaximumIterations } = this.options;

    const schemas = Object.fromEntries(await this.getSchemas());

    const document = {
      $schema: "https://schema.JsonSchema42.org/jns42-intermediate/schema.json" as const,
      schemas,
    };
    const specification = jns42generator.loadSpecification(document, {
      defaultTypeName: defaultName,
      nameMaximumIterations,
      transformMaximumIterations,
    });
    this.specification = specification;
  }

  private async getSchemas(): Promise<Iterable<readonly [string, any]>> {
    const documentContext = new jns42generator.DocumentContext();

    documentContext.registerFactory(
      jns42generator.schemaDraft04.metaSchemaId,
      ({ givenUrl, antecedentUrl, documentNode: rootNode }) =>
        new jns42generator.schemaDraft04.Document(
          givenUrl,
          antecedentUrl,
          rootNode,
          documentContext,
        ),
    );

    for (const [pointer, schema] of this.selectSchemas("", this.documentNode)) {
      const uri = new URL(
        (this.documentUri.hash === "" ? "#" : this.documentUri.hash) + pointer,
        this.documentUri,
      );

      await documentContext.loadFromDocument(
        uri,
        uri,
        this.documentUri,
        this.documentNode,
        jns42generator.schemaDraft04.metaSchemaId,
      );
    }

    return documentContext.getIntermediateSchemaEntries();
  }

  public abstract getApiModel(): models.Api;

  //#region selectors

  protected abstract selectSchemas(pointer: string, document: N): Iterable<[string, unknown]>;

  //#endregion
}
