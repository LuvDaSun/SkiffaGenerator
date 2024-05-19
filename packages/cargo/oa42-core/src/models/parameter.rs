use crate::utils::NodeLocation;

#[oa42_macros::model_container]
pub struct Parameter {
  location: NodeLocation,
  name: String,
  required: bool,
  schema_id: Option<NodeLocation>,
  mockable: bool,
}
