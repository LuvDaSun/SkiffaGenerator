import * as oas from "@jns42/oas-v3-1";
import * as models from "../../models/index.js";
import { DocumentBase } from "../document-base.js";

export class Document extends DocumentBase<oas.SchemaDocument> {
  public getApiModel(): models.Api {
    throw new Error("Method not implemented.");
  }

  protected getDefaultSchemaId(): string {
    return "https://spec.openapis.org/oas/3.1/dialect/base";
  }

  protected selectSchemas(pointer: string, document: unknown): Iterable<[string, unknown]> {
    throw new Error("Method not implemented.");
  }
}
