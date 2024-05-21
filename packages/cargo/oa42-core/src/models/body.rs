use crate::utils::NodeLocation;

#[oa42_macros::model_container]
pub struct Body {
  pub location: NodeLocation,
  pub content_type: String,
  pub schema_id: Option<NodeLocation>,
  pub mockable: bool,
}
