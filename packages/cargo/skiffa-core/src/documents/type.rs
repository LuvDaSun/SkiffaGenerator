use semver::Version;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Clone, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub enum DocumentType {
  OpenApiV30,
  OpenApiV31,
  Swagger2,
}

pub struct DocumentTypeError;

impl TryFrom<&serde_json::Value> for DocumentType {
  type Error = DocumentTypeError;

  fn try_from(value: &serde_json::Value) -> Result<Self, Self::Error> {
    let document = value.as_object().ok_or(DocumentTypeError)?;

    if let Some(version) = document.get("swagger") {
      let version = version.as_str().ok_or(DocumentTypeError)?;
      let version = Version::parse(version).map_err(|_error| DocumentTypeError)?;

      if version.major == 2 && version.minor == 0 {
        return Ok(Self::Swagger2);
      }
    }

    if let Some(version) = document.get("openapi") {
      let version = version.as_str().ok_or(DocumentTypeError)?;
      let version = Version::parse(version).map_err(|_error| DocumentTypeError)?;

      if version.major == 3 && version.minor == 0 {
        return Ok(Self::OpenApiV30);
      }

      if version.major == 3 && version.minor == 1 {
        return Ok(Self::OpenApiV31);
      }
    }

    Err(DocumentTypeError)
  }
}
