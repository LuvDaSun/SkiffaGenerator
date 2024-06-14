use super::{
  AuthenticationRequirementGroup, AuthenticationRequirementGroupContainer, Body, BodyContainer,
  Method, OperationResult, OperationResultContainer, Parameter, ParameterContainer,
};
use crate::utils::NodeLocation;
use std::rc;
use wasm_bindgen::prelude::*;

pub struct Operation {
  pub location: NodeLocation,
  pub method: Method,
  pub name: String,
  pub summary: Option<String>,
  pub description: Option<String>,
  pub deprecated: bool,
  pub mockable: bool,
  pub authentication_requirements: Vec<rc::Rc<AuthenticationRequirementGroup>>,
  pub query_parameters: Vec<rc::Rc<Parameter>>,
  pub header_parameters: Vec<rc::Rc<Parameter>>,
  pub path_parameters: Vec<rc::Rc<Parameter>>,
  pub cookie_parameters: Vec<rc::Rc<Parameter>>,
  pub bodies: Vec<rc::Rc<Body>>,
  pub operation_results: Vec<rc::Rc<OperationResult>>,
}

#[derive(Clone)]
#[wasm_bindgen]
pub struct OperationContainer(rc::Rc<Operation>);

#[wasm_bindgen]
impl OperationContainer {
  #[wasm_bindgen(getter, js_name = "location")]
  pub fn location(&self) -> String {
    self.0.location.to_string()
  }

  #[wasm_bindgen(getter, js_name = "method")]
  pub fn method(&self) -> Method {
    self.0.method.clone()
  }

  #[wasm_bindgen(getter, js_name = "name")]
  pub fn name(&self) -> String {
    self.0.name.clone()
  }

  #[wasm_bindgen(getter, js_name = "summary")]
  pub fn summary(&self) -> Option<String> {
    self.0.summary.clone()
  }

  #[wasm_bindgen(getter, js_name = "description")]
  pub fn description(&self) -> Option<String> {
    self.0.description.clone()
  }

  #[wasm_bindgen(getter, js_name = "deprecated")]
  pub fn deprecated(&self) -> bool {
    self.0.deprecated
  }

  #[wasm_bindgen(getter, js_name = "mockable")]
  pub fn mockable(&self) -> bool {
    self.0.mockable
  }

  #[wasm_bindgen(getter, js_name = "authenticationRequirements")]
  pub fn authentication_requirements(&self) -> Vec<AuthenticationRequirementGroupContainer> {
    self
      .0
      .authentication_requirements
      .iter()
      .cloned()
      .map(|model| model.into())
      .collect()
  }

  #[wasm_bindgen(getter, js_name = "queryParameters")]
  pub fn query_parameters(&self) -> Vec<ParameterContainer> {
    self
      .0
      .query_parameters
      .iter()
      .cloned()
      .map(|model| model.into())
      .collect()
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

  #[wasm_bindgen(getter, js_name = "pathParameters")]
  pub fn path_parameters(&self) -> Vec<ParameterContainer> {
    self
      .0
      .path_parameters
      .iter()
      .cloned()
      .map(|model| model.into())
      .collect()
  }

  #[wasm_bindgen(getter, js_name = "cookieParameters")]
  pub fn cookie_parameters(&self) -> Vec<ParameterContainer> {
    self
      .0
      .cookie_parameters
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

  #[wasm_bindgen(getter, js_name = "operationResults")]
  pub fn operation_results(&self) -> Vec<OperationResultContainer> {
    self
      .0
      .operation_results
      .iter()
      .cloned()
      .map(|model| model.into())
      .collect()
  }
}

impl From<rc::Rc<Operation>> for OperationContainer {
  fn from(interior: rc::Rc<Operation>) -> Self {
    Self(interior)
  }
}
