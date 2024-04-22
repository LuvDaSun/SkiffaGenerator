import path from "path";
import { fetchFile } from "./exports/fetch-file.js";
import { projectRoot } from "./root.js";
import { EnvironmentBase, ExportsBase, Ffi } from "./utils/index.js";

export interface MainEnvironment extends EnvironmentBase {
  host_fetch_file: (location: number, data: number, callback: number) => void;
}

let environment: MainEnvironment = {
  host_fetch_file(locationPointer, dataReferencePointer, callback) {
    mainFfi.spawn_and_callback(callback, () => fetchFile(locationPointer, dataReferencePointer));
  },
};

export interface MainExports extends ExportsBase {
  reference_drop(pointer_box: number): void;
  reference_new(): number;

  c_string_drop(pointer: number): void;
  c_string_new(size: number): number;

  vec_usize_drop(vec_usize: number): void;
  vec_usize_new(capacity: number): number;
  vec_usize_len(vec_usize: number): number;
  vec_usize_push(vec_usize: number, value: number): void;

  vec_string_drop(vec_usize: number): void;
  vec_string_new(capacity: number): number;
  vec_string_len(vec_usize: number): number;
  vec_string_get(vec_usize: number, index: number, error_reference: number): number;
  vec_string_push(vec_usize: number, value: number, error_reference: number): void;

  node_location_drop(node_location: number): void;
  node_location_clone(node_location: number): number;
  node_location_parse(input: number, error_reference: number): number;
  node_location_join(node_location: number, other_node_location: number): number;
  node_location_to_string(node_location: number, error_reference: number): number;
  node_location_to_fetch_string(node_location: number, error_reference: number): number;
  node_location_get_anchor(node_location: number, error_reference: number): number;
  node_location_get_pointer(node_location: number): number;
  node_location_get_path(node_location: number): number;
  node_location_get_hash(node_location: number): number;
  node_location_set_anchor(node_location: number, anchor: number, error_reference: number): number;
  node_location_set_pointer(node_location: number, pointer: number): number;
  node_location_push_pointer(node_location: number, pointer: number): number;
  node_location_set_root(node_location: number): number;
}

export type MainFfi = Ffi<MainExports, MainEnvironment>;

export const mainFfi: MainFfi = Ffi.fromFile<MainExports, MainEnvironment>(
  path.join(projectRoot, "bin", "main.wasm"),
  environment,
);
