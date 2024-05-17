use super::Operation;
use crate::utils::NodeLocation;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Path {
  id: usize,
  location: NodeLocation,
  pattern: String,
  operations: Vec<Operation>,
}
