use super::{BodyContainer, ParameterContainer};
use crate::utils::NodeLocation;

#[oa42_macros::model_container]
pub struct OperationResult {
  location: NodeLocation,
  description: String,
  status_kind: String,
  status_codes: Vec<usize>,
  header_parameters: Vec<ParameterContainer>,
  bodies: Vec<BodyContainer>,
  mockable: bool,
}
