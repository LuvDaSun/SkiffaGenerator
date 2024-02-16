import * as appsignal from "@appsignal/nodejs";
import * as opentelemetry from "@opentelemetry/api";
import {
  InstrumentationBase,
  InstrumentationNodeModuleDefinition,
} from "@opentelemetry/instrumentation";
import * as lib from "oa42-lib";

export class Instrumentation extends InstrumentationBase<typeof lib> {
  constructor() {
    super("oa42-appsignal", "*");
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
      appsignal.setCategory("request");
      try {
        const result = await inner();
        return result;
      } catch (error) {
        if (error instanceof Error) {
          appsignal.setError(error);
        } else {
          appsignal.setError(new Error(String(error)));
        }
        throw error;
      } finally {
        span.end();
      }
    });

  serverWrappers.endpointWrapper = (inner) =>
    tracer.startActiveSpan("endpoint", async (span) => {
      appsignal.setCategory("endpoint");
      try {
        const result = await inner();
        return result;
      } catch (error) {
        if (error instanceof Error) {
          appsignal.setError(error);
        } else {
          appsignal.setError(new Error(String(error)));
        }
        throw error;
      } finally {
        span.end();
      }
    });

  serverWrappers.authenticationWrapper = (inner, name) =>
    tracer.startActiveSpan("authentication", async (span) => {
      appsignal.setCategory("authentication");
      appsignal.setName(name);
      try {
        const result = await inner();
        return result;
      } catch (error) {
        if (error instanceof Error) {
          appsignal.setError(error);
        } else {
          appsignal.setError(new Error(String(error)));
        }
        throw error;
      } finally {
        span.end();
      }
    });

  serverWrappers.middlewareWrapper = (inner, name) =>
    tracer.startActiveSpan("middleware", async (span) => {
      appsignal.setCategory("middleware");
      appsignal.setName(name);
      try {
        const result = await inner();
        return result;
      } catch (error) {
        if (error instanceof Error) {
          appsignal.setError(error);
        } else {
          appsignal.setError(new Error(String(error)));
        }
        throw error;
      } finally {
        span.end();
      }
    });

  serverWrappers.operationWrapper = (inner, name) =>
    tracer.startActiveSpan("operation", async (span) => {
      appsignal.setCategory("operation");
      appsignal.setName(name);
      try {
        const result = await inner();
        return result;
      } catch (error) {
        if (error instanceof Error) {
          appsignal.setError(error);
        } else {
          appsignal.setError(new Error(String(error)));
        }
        throw error;
      } finally {
        span.end();
      }
    });

  //
}
