use super::OperationContainer;
use jns42_core::utils::NodeLocation;

#[oa42_macros::model_container]
pub struct Path {
  pub id: usize,
  pub location: NodeLocation,
  pub pattern: String,
  pub operations: Vec<OperationContainer>,
}
