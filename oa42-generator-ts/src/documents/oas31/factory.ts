import * as oas31 from "@jns42/jns42-schema-oas-v3-1";
import { DocumentInitializer } from "../document-context.js";
import { Document } from "./document.js";

export function factory({
  documentUri,
  documentNode,
  options,
}: DocumentInitializer) {
  if (oas31.isSchema20221007(documentNode)) {
    return new Document(documentUri, documentNode, options);
  }
}
