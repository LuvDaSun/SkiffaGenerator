use super::{BodyContainer, ParameterContainer};
use crate::utils::NodeLocation;

#[oa42_macros::model_container]
pub struct OperationResult {
  pub location: NodeLocation,
  pub description: Option<String>,
  pub status_kind: String,
  pub status_codes: Vec<usize>,
  pub mockable: bool,
  pub header_parameters: Vec<ParameterContainer>,
  pub bodies: Vec<BodyContainer>,
}
