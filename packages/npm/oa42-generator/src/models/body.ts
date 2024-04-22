import { NodeLocation } from "@jns42/core";

export interface Body {
  location: NodeLocation;
  contentType: string;
  schemaId?: string;
  mockable: boolean;
}
