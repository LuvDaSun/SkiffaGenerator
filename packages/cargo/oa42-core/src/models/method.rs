use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub enum Method {
  Get,
  Put,
  Post,
  Delete,
  Options,
  Head,
  Patch,
  Trace,
}
