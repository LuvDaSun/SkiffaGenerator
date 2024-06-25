import * as opentelemetry from "@opentelemetry/api";
import {
  InstrumentationBase,
  InstrumentationNodeModuleDefinition,
} from "@opentelemetry/instrumentation";
import * as lib from "oa42-lib";
import { packageInfo } from "./utils/index.js";

export interface InstrumentationConfiguration {
  enabled?: boolean;
}

export const defaultInstrumentationConfiguration = {
  enabled: true,
};

export class Instrumentation extends InstrumentationBase {
  constructor(configuration: InstrumentationConfiguration = {}) {
    const configurationWithDefaults = { ...defaultInstrumentationConfiguration, ...configuration };
    super(packageInfo.name ?? "", packageInfo.version ?? "", configurationWithDefaults);
  }

  private originalServerWrappers?: lib.ServerWrappers;
  protected init() {
    return new InstrumentationNodeModuleDefinition(
      "oa42-lib",
      [packageInfo.dependencies?.["oa42-lib"] ?? "*"],
      (moduleExports, moduleVersion) => {
        this.originalServerWrappers = moduleExports.defaultServerWrappers;
        instrument(moduleExports.defaultServerWrappers);
        return moduleExports;
      },
      (moduleExports, moduleVersion) => {
        if (this.originalServerWrappers == null) {
          return;
        }
        Object.assign(moduleExports, {
          defaultServerWrappers: this.originalServerWrappers,
        });
        this.originalServerWrappers = undefined;
      },
    );
  }
}

export function instrument(serverWrappers: lib.ServerWrappers) {
  const tracer = opentelemetry.trace.getTracer("server");

  serverWrappers.request = (inner) =>
    tracer.startActiveSpan("request", async (span) => {
      try {
        const result = await inner();
        return result;
      } finally {
        span.end();
      }
    });

  serverWrappers.endpoint = (inner) =>
    tracer.startActiveSpan("endpoint", async (span) => {
      try {
        const result = await inner();
        return result;
      } finally {
        span.end();
      }
    });

  serverWrappers.authentication = (inner, name) =>
    tracer.startActiveSpan(
      "authentication",
      { attributes: { authentication: name } },
      async (span) => {
        try {
          const result = await inner();
          return result;
        } finally {
          span.end();
        }
      },
    );

  serverWrappers.middleware = (inner, name) =>
    tracer.startActiveSpan("middleware", { attributes: { middleware: name } }, async (span) => {
      try {
        const result = await inner();
        return result;
      } finally {
        span.end();
      }
    });

  serverWrappers.operation = (inner, name) =>
    tracer.startActiveSpan("operation", { attributes: { operation: name } }, async (span) => {
      try {
        const result = await inner();
        return result;
      } finally {
        span.end();
      }
    });

  //
}
