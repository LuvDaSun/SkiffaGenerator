use crate::utils::NodeLocation;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Body {
  location: NodeLocation,
  content_type: String,
  schema_id: Option<NodeLocation>,
  mockable: bool,
}
