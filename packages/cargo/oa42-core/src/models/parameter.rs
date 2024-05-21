use crate::utils::NodeLocation;

#[oa42_macros::model_container]
pub struct Parameter {
  pub location: NodeLocation,
  pub name: String,
  pub required: bool,
  pub schema_id: Option<NodeLocation>,
  pub mockable: bool,
}
