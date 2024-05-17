use crate::utils::NodeLocation;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Parameter {
  location: NodeLocation,
  name: String,
  required: bool,
  schema_id: Option<NodeLocation>,
  mockable: bool,
}
