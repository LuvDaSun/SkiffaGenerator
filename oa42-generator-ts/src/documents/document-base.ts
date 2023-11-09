import * as models from "../models/index.js";
import { DocumentOptions } from "./document-context.js";

export abstract class DocumentBase<N = unknown, S = unknown> {
  constructor(
    protected readonly documentUri: URL,
    protected readonly documentNode: N,
    protected readonly options: DocumentOptions,
  ) {
    //
  }

  public abstract getApiModel(): Promise<models.Api>;
}
