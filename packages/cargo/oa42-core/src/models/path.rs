use super::Operation;
use crate::utils::NodeLocation;

#[oa42_macros::model]
pub struct Path {
  id: usize,
  location: NodeLocation,
  pattern: String,
  operations: Vec<Operation>,
}
