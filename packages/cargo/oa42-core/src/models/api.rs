use super::Path;
use crate::utils::NodeLocation;

#[oa42_macros::model]
pub struct Api {
  location: NodeLocation,
  paths: Vec<Path>,
}
