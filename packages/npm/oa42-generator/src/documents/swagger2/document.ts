import * as oas from "@jns42/swagger-v2";
import * as models from "../../models/index.js";
import { DocumentBase } from "../document-base.js";

export class Document extends DocumentBase<oas.SchemaJson> {
  public getApiModel(): models.Api {
    throw new Error("Method not implemented.");
  }

  protected getDefaultSchemaId(): string {
    return "https://spec.openapis.org/oas/3.0/schema/2021-09-28#/definitions/Schema";
  }

  protected selectSchemas(
    pointer: string[],
    document: oas.SchemaJson,
  ): Iterable<[string[], unknown]> {
    throw new Error("Method not implemented.");
  }
}
