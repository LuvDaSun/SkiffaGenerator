use crate::documents::{DocumentError, DocumentTypeError};
use jns42_core::utils::{NodeCacheError, ParseLocationError};
use std::fmt::Display;
use wasm_bindgen::prelude::*;

#[derive(Debug, Clone, Copy, Hash, Eq, PartialEq, Ord, PartialOrd)]
#[wasm_bindgen]
pub enum Error {
  Unknown,
  Conflict,
  NotFound,
  ParseLocationFailed,
  ParseMethodFailed,
  DocumentTypeError,
  FetchError,
  SerializationError,
}

impl std::error::Error for Error {}

impl Display for Error {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::Unknown => write!(f, "Unknown"),
      Self::Conflict => write!(f, "Conflict"),
      Self::NotFound => write!(f, "NotFound"),
      Self::ParseLocationFailed => write!(f, "ParseLocationFailed"),
      Self::ParseMethodFailed => write!(f, "ParseMethodFailed"),
      Self::DocumentTypeError => write!(f, "DocumentTypeError"),
      Self::FetchError => write!(f, "FetchError"),
      Self::SerializationError => write!(f, "SerializationError"),
    }
  }
  //
}

impl From<ParseLocationError> for Error {
  fn from(_value: ParseLocationError) -> Self {
    Self::ParseLocationFailed
  }
}

impl From<NodeCacheError> for Error {
  fn from(value: NodeCacheError) -> Self {
    match value {
      NodeCacheError::Conflict => Self::Conflict,
      NodeCacheError::FetchError => Self::FetchError,
      NodeCacheError::SerializationError => Self::SerializationError,
    }
  }
}

impl From<DocumentTypeError> for Error {
  fn from(_value: DocumentTypeError) -> Self {
    Self::DocumentTypeError
  }
}

impl From<DocumentError> for Error {
  fn from(value: DocumentError) -> Self {
    match value {
      DocumentError::Unknown => Self::Unknown,
      DocumentError::NodeNotFound => Self::NotFound,
      DocumentError::ParseLocationFailed => Self::ParseLocationFailed,
      DocumentError::ParseMethodFailed => Self::ParseMethodFailed,
    }
  }
}
