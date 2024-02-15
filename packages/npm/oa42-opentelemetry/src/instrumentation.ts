import * as opentelemetry from "@opentelemetry/api";
import {
  InstrumentationBase,
  InstrumentationModuleDefinition,
} from "@opentelemetry/instrumentation";
import { ServerWrappers } from "oa42-lib";

export class Oa42Instrumentation extends InstrumentationBase {
  protected init():
    | void
    | InstrumentationModuleDefinition<any>
    | InstrumentationModuleDefinition<any>[] {
    throw new Error("Method not implemented.");
  }
}

export function instrument(serverWrappers: ServerWrappers) {
  const tracer = opentelemetry.trace.getTracer("oa42");

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
    tracer.startActiveSpan(`authentication: ${name}`, async (span) => {
      try {
        const result = await inner();
        return result;
      } finally {
        span.end();
      }
    });

  serverWrappers.middlewareWrapper = (inner, name) =>
    tracer.startActiveSpan(`middleware: ${name}`, async (span) => {
      try {
        const result = await inner();
        return result;
      } finally {
        span.end();
      }
    });

  serverWrappers.operationWrapper = (inner, name) =>
    tracer.startActiveSpan(`operation: ${name}`, async (span) => {
      try {
        const result = await inner();
        return result;
      } finally {
        span.end();
      }
    });

  //
}
