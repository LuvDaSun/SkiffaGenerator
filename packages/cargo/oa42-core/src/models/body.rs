use crate::utils::NodeLocation;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Body {
  pub location: NodeLocation,
  pub content_type: String,
  pub schema_id: Option<NodeLocation>,
  pub mockable: bool,
}
