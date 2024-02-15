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
  //
}
