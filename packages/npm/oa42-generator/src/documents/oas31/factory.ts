import * as oas31 from "@jns42/oas-v3-1";
import { DocumentInitializer } from "../document-context.js";
import { Document } from "./document.js";

export function factory({
  documentLocation,
  documentNode,
  configuration: options,
}: DocumentInitializer) {
  if (oas31.isOasSchema(documentNode)) {
    return new Document(documentLocation, documentNode, options);
  }
}
