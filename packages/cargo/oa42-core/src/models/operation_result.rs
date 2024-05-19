use super::{Body, Parameter};
use crate::utils::NodeLocation;

#[oa42_macros::model]
pub struct OperationResult {
  location: NodeLocation,
  description: String,
  status_kind: String,
  status_codes: Vec<usize>,
  header_parameters: Vec<Parameter>,
  bodies: Vec<Body>,
  mockable: bool,
}
