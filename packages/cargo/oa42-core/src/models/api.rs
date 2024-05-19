use super::PathContainer;
use crate::utils::NodeLocation;

#[oa42_macros::model_container]
pub struct Api {
  location: NodeLocation,
  paths: Vec<PathContainer>,
}
