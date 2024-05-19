use crate::utils::NodeLocation;

#[oa42_macros::model]
pub struct Parameter {
  location: NodeLocation,
  name: String,
  required: bool,
  schema_id: Option<NodeLocation>,
  mockable: bool,
}
