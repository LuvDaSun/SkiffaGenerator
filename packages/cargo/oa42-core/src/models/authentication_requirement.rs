use std::rc;
use wasm_bindgen::prelude::*;

#[derive(Clone)]
pub struct AuthenticationRequirement {
  pub authentication_name: String,
  pub scopes: Vec<String>,
}

#[derive(Clone)]
#[wasm_bindgen]
pub struct AuthenticationRequirementContainer(rc::Rc<AuthenticationRequirement>);

#[wasm_bindgen]
impl AuthenticationRequirementContainer {
  #[wasm_bindgen(getter = authenticationName)]
  pub fn authentication_name(&self) -> String {
    self.0.authentication_name.clone()
  }

  #[wasm_bindgen(getter = scopes)]
  pub fn scopes(&self) -> Vec<String> {
    self.0.scopes.clone()
  }
}

impl From<rc::Rc<AuthenticationRequirement>> for AuthenticationRequirementContainer {
  fn from(interior: rc::Rc<AuthenticationRequirement>) -> Self {
    Self(interior)
  }
}
