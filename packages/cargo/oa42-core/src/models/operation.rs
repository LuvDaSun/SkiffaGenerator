use super::{
  AuthenticationRequirementContainer, BodyContainer, Method, OperationResultContainer,
  ParameterContainer,
};
use crate::utils::NodeLocation;

#[oa42_macros::model_container]
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
  // authentication_requirements: Vec<Vec<AuthenticationRequirementContainer>>,
  query_parameters: Vec<ParameterContainer>,
  header_parameters: Vec<ParameterContainer>,
  path_parameters: Vec<ParameterContainer>,
  cookie_parameters: Vec<ParameterContainer>,
  bodies: Vec<BodyContainer>,
  operation_results: Vec<OperationResultContainer>,
  mockable: bool,
}
