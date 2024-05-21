use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Clone)]
pub enum Method {
  Unknown,
  Get,
  Put,
  Post,
  Delete,
  Options,
  Head,
  Patch,
  Trace,
}

impl From<&str> for Method {
  fn from(value: &str) -> Self {
    match value.to_lowercase().as_str() {
      "get" => Self::Get,
      "put" => Self::Put,
      "post" => Self::Post,
      "delete" => Self::Delete,
      "options" => Self::Options,
      "head" => Self::Head,
      "patch" => Self::Patch,
      "trace" => Self::Trace,
      _ => Self::Unknown,
    }
  }
}
