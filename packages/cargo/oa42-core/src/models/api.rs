use super::{AuthenticationContainer, PathContainer};
use jns42_core::utils::NodeLocation;

#[oa42_macros::model_container]
pub struct Api {
  pub location: NodeLocation,
  pub paths: Vec<PathContainer>,
  pub authentication: Vec<AuthenticationContainer>,
}
