use super::{Body, BodyContainer, Parameter, ParameterContainer, StatusKind};
use crate::utils::NodeLocation;
use std::rc;
use wasm_bindgen::prelude::*;

pub struct OperationResult {
  pub location: NodeLocation,
  pub description: Option<String>,
  pub status_kind: StatusKind,
  pub status_codes: Vec<usize>,
  pub mockable: bool,
  pub header_parameters: Vec<rc::Rc<Parameter>>,
  pub bodies: Vec<rc::Rc<Body>>,
}

#[derive(Clone)]
#[wasm_bindgen]
pub struct OperationResultContainer(rc::Rc<OperationResult>);

#[wasm_bindgen]
impl OperationResultContainer {
  #[wasm_bindgen(getter, js_name = "location")]
  pub fn location(&self) -> String {
    self.0.location.to_string()
  }

  #[wasm_bindgen(getter, js_name = "description")]
  pub fn description(&self) -> Option<String> {
    self.0.description.clone()
  }

  #[wasm_bindgen(getter, js_name = "statusKind")]
  pub fn status_kind(&self) -> String {
    self.0.status_kind.to_string()
  }

  #[wasm_bindgen(getter, js_name = "statusCodes")]
  pub fn status_codes(&self) -> Vec<usize> {
    self.0.status_codes.clone()
  }

  #[wasm_bindgen(getter, js_name = "mockable")]
  pub fn mockable(&self) -> bool {
    self.0.mockable
  }

  #[wasm_bindgen(getter, js_name = "headerParameters")]
  pub fn header_parameters(&self) -> Vec<ParameterContainer> {
    self
      .0
      .header_parameters
      .iter()
      .cloned()
      .map(|model| model.into())
      .collect()
  }

  #[wasm_bindgen(getter, js_name = "bodies")]
  pub fn bodies(&self) -> Vec<BodyContainer> {
    self
      .0
      .bodies
      .iter()
      .cloned()
      .map(|model| model.into())
      .collect()
  }
}

impl From<rc::Rc<OperationResult>> for OperationResultContainer {
  fn from(interior: rc::Rc<OperationResult>) -> Self {
    Self(interior)
  }
}
