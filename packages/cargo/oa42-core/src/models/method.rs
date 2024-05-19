use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Clone)]
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
