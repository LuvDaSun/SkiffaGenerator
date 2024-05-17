use super::{Body, Parameter};
use crate::utils::NodeLocation;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct OperationResult {
  location: NodeLocation,
  description: String,
  status_kind: String,
  status_codes: Vec<usize>,
  header_parameters: Vec<Parameter>,
  bodies: Vec<Body>,
  mockable: bool,
}
