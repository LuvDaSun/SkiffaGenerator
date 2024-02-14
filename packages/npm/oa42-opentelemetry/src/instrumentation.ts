import {
  InstrumentationBase,
  InstrumentationModuleDefinition,
} from "@opentelemetry/instrumentation";

export class Oa42Instrumentation extends InstrumentationBase {
  protected init():
    | void
    | InstrumentationModuleDefinition<any>
    | InstrumentationModuleDefinition<any>[] {
    throw new Error("Method not implemented.");
  }
}
