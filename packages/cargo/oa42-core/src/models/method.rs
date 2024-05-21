use wasm_bindgen::prelude::*;

pub struct MethodParseError;

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

impl TryFrom<&str> for Method {
  type Error = MethodParseError;

  fn try_from(value: &str) -> Result<Self, Self::Error> {
    match value {
      "get" => Ok(Self::Get),
      "put" => Ok(Self::Put),
      "post" => Ok(Self::Post),
      "delete" => Ok(Self::Delete),
      "options" => Ok(Self::Options),
      "head" => Ok(Self::Head),
      "patch" => Ok(Self::Patch),
      "trace" => Ok(Self::Trace),
      _ => Err(MethodParseError),
    }
  }
}
