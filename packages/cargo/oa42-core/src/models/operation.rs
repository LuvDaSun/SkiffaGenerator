use super::{AuthenticationRequirement, Body, Method, OperationResult, Parameter};
use crate::utils::NodeLocation;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Operation {
  pub location: NodeLocation,
  pub method: Method,
  pub name: String,
  pub deprecated: bool,
  pub summary: String,
  pub description: String,
  /**
   * all authentications from the second level should pass, any authentications
   * of the first level should pass
   */
  pub authentication_requirements: Vec<Vec<AuthenticationRequirement>>,
  pub query_parameters: Vec<Parameter>,
  pub header_parameters: Vec<Parameter>,
  pub path_parameters: Vec<Parameter>,
  pub cookie_parameters: Vec<Parameter>,
  pub bodies: Vec<Body>,
  pub operation_results: Vec<OperationResult>,
  pub mockable: bool,
}
