use crate::utils::NodeLocation;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Parameter {
  pub location: NodeLocation,
  pub name: String,
  pub required: bool,
  pub schema_id: Option<NodeLocation>,
  pub mockable: bool,
}
