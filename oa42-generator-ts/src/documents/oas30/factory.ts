import * as oas30 from "@jns42/jns42-schema-oas-v3-0";
import { DocumentInitializer } from "../document-context.js";
import { Document } from "./document.js";

export function factory({
  documentUri,
  documentNode,
  options,
}: DocumentInitializer) {
  if (oas30.isSchema20210928(documentNode)) {
    return new Document(documentUri, documentNode, options);
  }
}
