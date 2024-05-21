use crate::{models::MethodParseError, utils::ParseError};
use std::fmt::Display;
use wasm_bindgen::prelude::*;

#[derive(Debug, Clone, Copy, Hash, Eq, PartialEq, Ord, PartialOrd)]
#[wasm_bindgen]
pub enum Error {
  Unknown,
  NodeNotFound,
  ParseLocationFailed,
  ParseMethodFailed,
}

impl std::error::Error for Error {}

impl Display for Error {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::Unknown => write!(f, "Unknown"),
      Self::NodeNotFound => write!(f, "Conflict"),
      Self::ParseLocationFailed => write!(f, "ParseLocationFailed"),
      Self::ParseMethodFailed => write!(f, "ParseMethodFailed"),
    }
  }
}

impl From<ParseError> for Error {
  fn from(value: ParseError) -> Self {
    match value {
      ParseError::InvalidInput => Self::ParseLocationFailed,
      ParseError::DecodeError => Self::ParseLocationFailed,
    }
  }
}

impl From<MethodParseError> for Error {
  fn from(_value: MethodParseError) -> Self {
    Self::ParseMethodFailed
  }
}
