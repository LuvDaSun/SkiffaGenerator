export type Authentication =
  | ApiKeyAuthentication
  | HttpBasicAuthentication
  | HttpBearerAuthentication;

export interface ApiKeyAuthentication {
  name: string;
  type: "apiKey";
  in: "query" | "header" | "cookie";
}

export interface HttpBasicAuthentication {
  name: string;
  type: "http";
  scheme: "basic";
}

export interface HttpBearerAuthentication {
  name: string;
  type: "http";
  scheme: "bearer";
}
