import { DocumentBase } from "./document-base.js";

export interface DocumentConfiguration {
  defaultTypeName: string;
  nameMaximumIterations: number;
  transformMaximumIterations: number;
  requestTypes: string[];
  responseTypes: string[];
}

export interface DocumentInitializer<N = unknown> {
  documentLocation: string;
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

  public registerFactory(factory: DocumentFactory) {
    this.factories.push(factory);
  }

  public getApiModel() {
    return this.document.getApiModel();
  }

  public getSpecification() {
    return this.document.getSpecification();
  }
}
