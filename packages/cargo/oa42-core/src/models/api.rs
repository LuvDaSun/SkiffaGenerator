use super::{Authentication, AuthenticationContainer, Path, PathContainer};
use crate::utils::NodeLocation;
use std::rc;
use wasm_bindgen::prelude::*;

#[derive(Clone)]
pub struct Api {
  pub location: NodeLocation,
  pub paths: Vec<rc::Rc<Path>>,
  pub authentication: Vec<rc::Rc<Authentication>>,
}

#[derive(Clone)]
#[wasm_bindgen]
pub struct ApiContainer(rc::Rc<Api>);

#[wasm_bindgen]
impl ApiContainer {
  #[wasm_bindgen(getter, js_name = "location")]
  pub fn location(&self) -> String {
    self.0.location.to_string()
  }

  #[wasm_bindgen(getter, js_name = "paths")]
  pub fn paths(&self) -> Vec<PathContainer> {
    self
      .0
      .paths
      .iter()
      .cloned()
      .map(|model| model.into())
      .collect()
  }

  #[wasm_bindgen(getter, js_name = "authentication")]
  pub fn authentication(&self) -> Vec<AuthenticationContainer> {
    self
      .0
      .authentication
      .iter()
      .cloned()
      .map(|model| model.into())
      .collect()
  }
}

impl From<rc::Rc<Api>> for ApiContainer {
  fn from(interior: rc::Rc<Api>) -> Self {
    Self(interior)
  }
}
