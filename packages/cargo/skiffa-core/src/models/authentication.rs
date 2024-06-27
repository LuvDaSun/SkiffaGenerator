use std::rc;
use wasm_bindgen::prelude::*;

use crate::utils::NodeLocation;

pub struct Authentication {
  pub location: NodeLocation,
  pub name: String,
  pub description: Option<String>,
  pub r#type: String,
  pub parameter_name: Option<String>,
  pub r#in: Option<String>,
  pub scheme: Option<String>,
}

#[derive(Clone)]
#[wasm_bindgen]
pub struct AuthenticationContainer(rc::Rc<Authentication>);

#[wasm_bindgen]
impl AuthenticationContainer {
  #[wasm_bindgen(getter, js_name = "location")]
  pub fn location(&self) -> String {
    self.0.location.to_string()
  }

  #[wasm_bindgen(getter, js_name = "name")]
  pub fn name(&self) -> String {
    self.0.name.clone()
  }

  #[wasm_bindgen(getter, js_name = "description")]
  pub fn description(&self) -> Option<String> {
    self.0.description.clone()
  }

  #[wasm_bindgen(getter, js_name = "type")]
  pub fn r#type(&self) -> String {
    self.0.r#type.clone()
  }

  #[wasm_bindgen(getter, js_name = "parameterName")]
  pub fn parameter_name(&self) -> Option<String> {
    self.0.parameter_name.clone()
  }

  #[wasm_bindgen(getter, js_name = "in")]
  pub fn r#in(&self) -> Option<String> {
    self.0.r#in.clone()
  }

  #[wasm_bindgen(getter, js_name = "scheme")]
  pub fn scheme(&self) -> Option<String> {
    self.0.scheme.clone()
  }
}

impl From<rc::Rc<Authentication>> for AuthenticationContainer {
  fn from(interior: rc::Rc<Authentication>) -> Self {
    Self(interior)
  }
}
