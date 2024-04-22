import { NodeLocation } from "@jns42/core";

export interface Parameter {
  location: NodeLocation;
  name: string;
  required: boolean;
  schemaId?: string;
  mockable: boolean;
}
