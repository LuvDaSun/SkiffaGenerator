use super::{Operation, OperationContainer};
use crate::utils::NodeLocation;
use std::rc;
use wasm_bindgen::prelude::*;

pub struct Path {
  pub id: usize,
  pub location: NodeLocation,
  pub pattern: String,
  pub operations: Vec<rc::Rc<Operation>>,
}

#[derive(Clone)]
#[wasm_bindgen]
pub struct PathContainer(rc::Rc<Path>);

#[wasm_bindgen]
impl PathContainer {
  #[wasm_bindgen(getter, js_name = "id")]
  pub fn id(&self) -> usize {
    self.0.id
  }

  #[wasm_bindgen(getter, js_name = "location")]
  pub fn location(&self) -> String {
    self.0.location.to_string()
  }

  #[wasm_bindgen(getter, js_name = "pattern")]
  pub fn pattern(&self) -> String {
    self.0.pattern.clone()
  }

  #[wasm_bindgen(getter, js_name = "operations")]
  pub fn operations(&self) -> Vec<OperationContainer> {
    self
      .0
      .operations
      .iter()
      .cloned()
      .map(|model| model.into())
      .collect()
  }
}

impl From<rc::Rc<Path>> for PathContainer {
  fn from(interior: rc::Rc<Path>) -> Self {
    Self(interior)
  }
}
