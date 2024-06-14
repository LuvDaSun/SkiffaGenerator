use super::{AuthenticationRequirement, AuthenticationRequirementContainer};
use std::rc;
use wasm_bindgen::prelude::*;

#[derive(Clone)]
pub struct AuthenticationRequirementGroup {
  pub requirements: Vec<rc::Rc<AuthenticationRequirement>>,
}

#[derive(Clone)]
#[wasm_bindgen]
pub struct AuthenticationRequirementGroupContainer(rc::Rc<AuthenticationRequirementGroup>);

#[wasm_bindgen]
impl AuthenticationRequirementGroupContainer {
  #[wasm_bindgen(getter = requirements)]
  pub fn requirements(&self) -> Vec<AuthenticationRequirementContainer> {
    self
      .0
      .requirements
      .iter()
      .cloned()
      .map(|model| model.into())
      .collect()
  }
}

impl From<rc::Rc<AuthenticationRequirementGroup>> for AuthenticationRequirementGroupContainer {
  fn from(interior: rc::Rc<AuthenticationRequirementGroup>) -> Self {
    Self(interior)
  }
}
