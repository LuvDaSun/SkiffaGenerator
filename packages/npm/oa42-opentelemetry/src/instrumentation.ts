import * as opentelemetry from "@opentelemetry/api";
import {
  InstrumentationBase,
  InstrumentationNodeModuleDefinition,
} from "@opentelemetry/instrumentation";
import * as lib from "oa42-lib";

export class Instrumentation extends InstrumentationBase<typeof lib> {
  constructor() {
    super("oa42-opentelemetry", "*");
  }

  private originalServerWrappers?: lib.ServerWrappers;
  protected init() {
    return new InstrumentationNodeModuleDefinition<typeof lib>(
      "oa42-lib",
      ["*"],
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
  const tracer = opentelemetry.trace.getTracer("oa42-server");

  serverWrappers.requestWrapper = (inner) =>
    tracer.startActiveSpan("request", async (span) => {
      try {
        const result = await inner();
        return result;
      } finally {
        span.end();
      }
    });

  serverWrappers.endpointWrapper = (inner) =>
    tracer.startActiveSpan("endpoint", async (span) => {
      try {
        const result = await inner();
        return result;
      } finally {
        span.end();
      }
    });

  serverWrappers.authenticationWrapper = (inner, name) =>
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

  serverWrappers.middlewareWrapper = (inner, name) =>
    tracer.startActiveSpan("middleware", { attributes: { middleware: name } }, async (span) => {
      try {
        const result = await inner();
        return result;
      } finally {
        span.end();
      }
    });

  serverWrappers.operationWrapper = (inner, name) =>
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
