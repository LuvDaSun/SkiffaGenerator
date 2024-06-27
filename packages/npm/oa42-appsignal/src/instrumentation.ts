import * as appsignal from "@appsignal/nodejs";
import * as opentelemetry from "@opentelemetry/api";
import {
  InstrumentationBase,
  InstrumentationNodeModuleDefinition,
} from "@opentelemetry/instrumentation";
import * as lib from "skiffa-lib";
import { packageInfo } from "./utils/index.js";

export interface InstrumentationConfiguration {
  enabled?: boolean;
}

export const defaultInstrumentationConfiguration = {
  enabled: true,
};

export class Instrumentation extends InstrumentationBase<InstrumentationConfiguration> {
  constructor(configuration: InstrumentationConfiguration = {}) {
    const configurationWithDefaults = { ...defaultInstrumentationConfiguration, ...configuration };
    super(packageInfo.name ?? "", packageInfo.version ?? "", configurationWithDefaults);
  }

  private originalServerWrappers?: lib.ServerWrappers;
  protected init() {
    return new InstrumentationNodeModuleDefinition(
      "skiffa-lib",
      [packageInfo.dependencies?.["skiffa-lib"] ?? "*"],
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

  serverWrappers.endpoint = (inner) =>
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

  serverWrappers.authentication = (inner, name) =>
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

  serverWrappers.middleware = (inner, name) =>
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

  serverWrappers.operation = (inner, name) =>
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
