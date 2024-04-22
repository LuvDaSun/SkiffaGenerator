import fs from "node:fs";
import { newKey } from "./key.js";

export interface ExportsBase {
  memory: WebAssembly.Memory;
  invoke_callback(key: number): void;
}
export interface EnvironmentBase {
  [name: string]: WebAssembly.ImportValue;
}

export class Ffi<Exports extends ExportsBase, Environment extends EnvironmentBase> {
  public static fromFile<Exports extends ExportsBase, Environment extends EnvironmentBase>(
    path: string,
    environment: Environment,
  ) {
    const buffer = fs.readFileSync(path);
    return Ffi.fromBuffer<Exports, Environment>(buffer, environment);
  }

  public static fromBuffer<Exports extends ExportsBase, Environment extends EnvironmentBase>(
    buffer: BufferSource,
    environment: Environment,
  ) {
    const module = new WebAssembly.Module(buffer);
    return Ffi.fromModule<Exports, Environment>(module, environment);
  }

  public static fromModule<Exports extends ExportsBase, Environment extends EnvironmentBase>(
    module: WebAssembly.Module,
    environment: Environment,
  ) {
    const instance = new WebAssembly.Instance(module, {
      env: {
        ...environment,
        host_invoke_callback(key: number) {
          ffi.invokeCallback(key);
        },
      },
    });
    const ffi = new Ffi<Exports, Environment>(instance);
    return ffi;
  }

  private constructor(private readonly instance: WebAssembly.Instance) {
    //
  }

  public get exports() {
    return this.instance.exports as unknown as Exports;
  }

  private readonly callbacks: Record<number, () => void> = {};

  private memoryUint8Cache?: Uint8Array;
  public get memoryUint8() {
    // if not defined or detached. For some reason (if the memory grows?) the array automatically detaches.
    if (this.memoryUint8Cache == null || this.memoryUint8Cache.buffer.byteLength === 0) {
      this.memoryUint8Cache = new Uint8Array(this.exports.memory.buffer);
    }
    return this.memoryUint8Cache;
  }

  private memoryViewCache?: DataView;
  public get memoryView() {
    // if not defined or detached. For some reason the view automatically detaches
    if (this.memoryViewCache == null || this.memoryViewCache.buffer.byteLength === 0) {
      this.memoryViewCache = new DataView(this.exports.memory.buffer);
    }
    return this.memoryViewCache;
  }

  public spawn_and_callback(callback: number, task: () => Promise<void>) {
    task().finally(() => this.exports.invoke_callback(callback));
  }

  public registerCallback(callback: () => void) {
    let key = newKey();
    this.callbacks[key] = callback;
    return key;
  }

  private invokeCallback(key: number) {
    try {
      this.callbacks[key]();
    } finally {
      delete this.callbacks[key];
    }
    return key;
  }
}
