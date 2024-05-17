use super::Operation;
use crate::utils::NodeLocation;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Path {
  pub id: usize,
  pub location: NodeLocation,
  pub pattern: String,
  pub operations: Vec<Operation>,
}
