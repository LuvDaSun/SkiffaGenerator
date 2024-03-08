import { NodeLocation } from "jns42-generator";

export interface Parameter {
  location: NodeLocation;
  name: string;
  required: boolean;
  schemaId?: string;
  mockable: boolean;
}
