use crate::utils::NodeLocation;

#[oa42_macros::model]
pub struct Body {
  location: NodeLocation,
  content_type: String,
  schema_id: Option<NodeLocation>,
  mockable: bool,
}
