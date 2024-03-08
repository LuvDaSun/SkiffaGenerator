import { NodeLocation } from "jns42-generator";
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

  constructor(private readonly configurations: DocumentConfiguration) {
    //
  }

  public registerFactory(factory: DocumentFactory) {
    this.factories.push(factory);
  }

  public async loadFromLocation(documentLocation: NodeLocation) {
    documentLocation = documentLocation.toRoot();

    const documentNode = await loadYAML(documentLocation.toString(false));
    await this.loadFromDocument(documentLocation, documentNode);
  }

  public async loadFromDocument(documentLocation: NodeLocation, documentNode: unknown) {
    documentLocation = documentLocation.toRoot();

    for (const factory of this.factories) {
      const document = factory({
        documentLocation,
        documentNode,
        configuration: this.configurations,
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
