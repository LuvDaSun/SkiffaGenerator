use super::Path;
use crate::utils::NodeLocation;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Api {
  location: NodeLocation,
  paths: Vec<Path>,
}

#[wasm_bindgen]
impl Api {
  #[wasm_bindgen(getter, js_name = "location")]
  pub fn get_location(&self) -> NodeLocation {
    self.location.clone()
  }
}
