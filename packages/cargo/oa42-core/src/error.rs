use crate::utils::ParseError;
use std::fmt::Display;

#[derive(Debug, Clone, Copy, Hash, Eq, PartialEq, Ord, PartialOrd)]
#[repr(usize)]
pub enum Error {
  Ok = 0,
  Unknown,
  Conflict,
  NotFound,
  ParseLocationFailed,
  HttpError,
  IoError,
  NulMissing,
  Utf8Error,
  InvalidJson,
  NotARoot,
  NotTheSame,
  InvalidYaml,
}

impl std::error::Error for Error {}

impl Display for Error {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::Ok => write!(f, "Ok"),
      Self::Unknown => write!(f, "Unknown"),
      Self::Conflict => write!(f, "Conflict"),
      Self::NotFound => write!(f, "NotFound"),
      Self::ParseLocationFailed => write!(f, "ParseLocationFailed"),
      Self::HttpError => write!(f, "HttpError"),
      Self::IoError => write!(f, "IoError"),
      Self::NulMissing => write!(f, "NulMissing"),
      Self::Utf8Error => write!(f, "Utf8Error"),
      Self::InvalidJson => write!(f, "InvalidJson"),
      Self::NotARoot => write!(f, "NotARoot"),
      Self::NotTheSame => write!(f, "NotTheSame"),
      Self::InvalidYaml => write!(f, "InvalidYaml"),
    }
  }
  //
}

impl From<ParseError> for Error {
  fn from(value: ParseError) -> Self {
    match value {
      ParseError::InvalidInput => Self::ParseLocationFailed,
      ParseError::DecodeError => Self::ParseLocationFailed,
    }
  }
}

impl From<std::ffi::NulError> for Error {
  fn from(_value: std::ffi::NulError) -> Self {
    Self::NulMissing
  }
}

impl From<std::str::Utf8Error> for Error {
  fn from(_value: std::str::Utf8Error) -> Self {
    Self::Utf8Error
  }
}

impl From<serde_json::Error> for Error {
  fn from(_value: serde_json::Error) -> Self {
    Self::InvalidJson
  }
}

impl From<serde_yaml::Error> for Error {
  fn from(_value: serde_yaml::Error) -> Self {
    Self::InvalidYaml
  }
}

impl From<std::io::Error> for Error {
  fn from(_value: std::io::Error) -> Self {
    Self::IoError
  }
}

#[cfg(not(target_os = "unknown"))]
impl From<surf::Error> for Error {
  fn from(_value: surf::Error) -> Self {
    Self::HttpError
  }
}
