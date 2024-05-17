use crate::utils::NodeRc;
use semver::Version;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Clone, PartialEq, Eq, Hash)]
pub enum SpecificationDocumentType {
  OpenApiV30,
  OpenApiV31,
  Swagger2,
}

impl TryFrom<&NodeRc> for SpecificationDocumentType {
  type Error = ();

  fn try_from(value: &NodeRc) -> Result<Self, Self::Error> {
    let document = value.as_object().ok_or(())?;

    if let Some(version) = document.get("swagger") {
      let version = version.as_str().ok_or(())?;
      let version = Version::parse(version).map_err(|_error| ())?;

      if version.major == 2 && version.minor == 0 {
        return Ok(Self::Swagger2);
      }
    }

    if let Some(version) = document.get("openapi") {
      let version = version.as_str().ok_or(())?;
      let version = Version::parse(version).map_err(|_error| ())?;

      if version.major == 3 && version.minor == 0 {
        return Ok(Self::OpenApiV30);
      }

      if version.major == 3 && version.minor == 1 {
        return Ok(Self::OpenApiV31);
      }
    }

    return Err(());
  }
}
