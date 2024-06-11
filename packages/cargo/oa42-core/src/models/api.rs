use super::{AuthenticationContainer, PathContainer};
use crate::utils::NodeLocation;

#[oa42_macros::model_container]
pub struct Api {
  pub location: NodeLocation,
  pub paths: Vec<PathContainer>,
  pub authentication: Vec<AuthenticationContainer>,
}
