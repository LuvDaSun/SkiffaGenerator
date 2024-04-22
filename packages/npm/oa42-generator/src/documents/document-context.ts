import { NodeLocation } from "@jns42/core";
import { loadYAML } from "../utils/index.js";
import { DocumentBase } from "./document-base.js";

export interface DocumentConfiguration {
  defaultTypeName: string;
  nameMaximumIterations: number;
  transformMaximumIterations: number;
  requestTypes: string[];
  responseTypes: string[];
}

export interface DocumentInitializer<N = unknown> {
  documentLocation: NodeLocation;
  documentNode: N;
  configuration: DocumentConfiguration;
}

export type DocumentFactory<N = unknown> = (
  initializer: DocumentInitializer<N>,
) => DocumentBase<N> | undefined;

export class DocumentContext {
  private factories = new Array<DocumentFactory>();
  private document!: DocumentBase;

  constructor(private readonly configuration: DocumentConfiguration) {
    //
  }

  [Symbol.dispose]() {
    this.document?.[Symbol.dispose]();
  }

  public registerFactory(factory: DocumentFactory) {
    this.factories.push(factory);
  }

  public async loadFromLocation(documentLocation: string) {
    const documentNode = await loadYAML(documentLocation);
    await this.loadFromDocument(documentLocation, documentNode);
  }

  public async loadFromDocument(documentLocation: string, documentNode: unknown) {
    for (const factory of this.factories) {
      const document = factory({
        documentLocation: NodeLocation.parse(documentLocation),
        documentNode,
        configuration: this.configuration,
      });
      if (document != null) {
        await document.load();
        this.document = document;
        break;
      }
    }

    if (this.document == null) {
      throw new Error("unable to load document");
    }
  }

  public getApiModel() {
    return this.document.getApiModel();
  }

  public getSpecification() {
    return this.document.getSpecification();
  }
}
