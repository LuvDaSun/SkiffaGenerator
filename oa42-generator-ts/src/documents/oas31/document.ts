import * as oas from "@jns42/jns42-schema-oas-v3-1";
import * as models from "../../models/index.js";
import { DocumentBase } from "../document-base.js";

export class Document extends DocumentBase<oas.Schema20221007> {
  public getApiModel(): Promise<models.Api> {
    throw new Error("Method not implemented.");
  }
}
