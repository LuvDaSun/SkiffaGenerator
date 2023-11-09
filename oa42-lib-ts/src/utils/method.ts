import { IterableElement } from "type-fest";

export const methods = [
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
  "trace",
] as const;

export type Method = IterableElement<typeof methods>;
