use super::Path;
use crate::utils::NodeLocation;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Api {
  pub location: NodeLocation,
  pub paths: Vec<Path>,
}
