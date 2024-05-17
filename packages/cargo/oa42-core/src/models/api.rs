use super::Path;
use crate::utils::NodeLocation;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Api {
  location: NodeLocation,
  paths: Vec<Path>,
}
