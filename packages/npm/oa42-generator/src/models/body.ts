import { NodeLocation } from "@oa42/core";

export interface Body {
  location: NodeLocation;
  contentType: string;
  schemaId?: string;
  mockable: boolean;
}
