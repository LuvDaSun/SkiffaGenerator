use std::rc;
use wasm_bindgen::prelude::*;

#[derive(Clone)]
pub struct Authentication {
  pub name: String,
  pub r#type: String,
  pub r#in: Option<String>,
  pub scheme: Option<String>,
}

#[derive(Clone)]
#[wasm_bindgen]
pub struct AuthenticationContainer(rc::Rc<Authentication>);

#[wasm_bindgen]
impl AuthenticationContainer {
  #[wasm_bindgen(getter = name)]
  pub fn name(&self) -> String {
    self.0.name.clone()
  }

  #[wasm_bindgen(getter = parameterType)]
  pub fn parameter_type(&self) -> String {
    self.0.r#type.clone()
  }

  #[wasm_bindgen(getter = parameterIn)]
  pub fn parameter_in(&self) -> Option<String> {
    self.0.r#in.clone()
  }

  #[wasm_bindgen(getter = scheme)]
  pub fn scheme(&self) -> Option<String> {
    self.0.scheme.clone()
  }
}

impl From<rc::Rc<Authentication>> for AuthenticationContainer {
  fn from(interior: rc::Rc<Authentication>) -> Self {
    Self(interior)
  }
}
