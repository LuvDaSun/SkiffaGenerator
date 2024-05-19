use super::OperationContainer;
use crate::utils::NodeLocation;

#[oa42_macros::model_container]
pub struct Path {
  id: usize,
  location: NodeLocation,
  pattern: String,
  operations: Vec<OperationContainer>,
}
