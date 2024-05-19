use super::{AuthenticationRequirement, Body, Method, OperationResult, Parameter};
use crate::utils::NodeLocation;

#[oa42_macros::model]
pub struct Operation {
  location: NodeLocation,
  method: Method,
  name: String,
  deprecated: bool,
  summary: String,
  description: String,
  /**
   * all authentications from the second level should pass, any authentications
   * of the first level should pass
   */
  // authentication_requirements: Vec<Vec<AuthenticationRequirement>>,
  query_parameters: Vec<Parameter>,
  header_parameters: Vec<Parameter>,
  path_parameters: Vec<Parameter>,
  cookie_parameters: Vec<Parameter>,
  bodies: Vec<Body>,
  operation_results: Vec<OperationResult>,
  mockable: bool,
}
