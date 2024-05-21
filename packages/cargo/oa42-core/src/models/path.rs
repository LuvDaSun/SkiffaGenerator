use super::OperationContainer;
use crate::utils::NodeLocation;

#[oa42_macros::model_container]
pub struct Path {
  pub id: usize,
  pub location: NodeLocation,
  pub pattern: String,
  pub operations: Vec<OperationContainer>,
}
