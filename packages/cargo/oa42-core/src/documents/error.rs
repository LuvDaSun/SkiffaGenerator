use crate::models::MethodParseError;
use jns42_core::utils::ParseLocationError;
use std::fmt::Display;
use wasm_bindgen::prelude::*;

#[derive(Debug, Clone, Copy, Hash, Eq, PartialEq, Ord, PartialOrd)]
#[wasm_bindgen]
pub enum DocumentError {
  Unknown,
  NodeNotFound,
  ParseLocationFailed,
  ParseMethodFailed,
}

impl std::error::Error for DocumentError {}

impl Display for DocumentError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::Unknown => write!(f, "Unknown"),
      Self::NodeNotFound => write!(f, "NodeNotFound"),
      Self::ParseLocationFailed => write!(f, "ParseLocationFailed"),
      Self::ParseMethodFailed => write!(f, "ParseMethodFailed"),
    }
  }
}

impl From<ParseLocationError> for DocumentError {
  fn from(_value: ParseLocationError) -> Self {
    Self::ParseLocationFailed
  }
}

impl From<MethodParseError> for DocumentError {
  fn from(_value: MethodParseError) -> Self {
    Self::ParseMethodFailed
  }
}
