import { NodeLocation } from "jns42-generator";

export interface Body {
  location: NodeLocation;
  contentType: string;
  schemaId?: string;
  mockable: boolean;
}
