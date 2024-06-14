use std::str::FromStr;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
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

impl FromStr for Method {
  type Err = MethodParseError;

  fn from_str(value: &str) -> Result<Self, Self::Err> {
    Ok(match value {
      "get" => Self::Get,
      "put" => Self::Put,
      "post" => Self::Post,
      "delete" => Self::Delete,
      "options" => Self::Options,
      "head" => Self::Head,
      "patch" => Self::Patch,
      "trace" => Self::Trace,
      _ => Err(MethodParseError)?,
    })
  }
}

#[allow(clippy::to_string_trait_impl)]
impl ToString for Method {
  fn to_string(&self) -> String {
    match self {
      Self::Get => "get".to_owned(),
      Self::Put => "put".to_owned(),
      Self::Post => "post".to_owned(),
      Self::Delete => "delete".to_owned(),
      Self::Options => "options".to_owned(),
      Self::Head => "head".to_owned(),
      Self::Patch => "patch".to_owned(),
      Self::Trace => "trace".to_owned(),
    }
  }
}

pub struct MethodParseError;
