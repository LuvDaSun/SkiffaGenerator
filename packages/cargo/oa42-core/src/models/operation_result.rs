use super::{Body, Parameter};
use crate::utils::NodeLocation;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct OperationResult {
  pub location: NodeLocation,
  pub description: String,
  pub status_kind: String,
  pub status_codes: Vec<usize>,
  pub header_parameters: Vec<Parameter>,
  pub bodies: Vec<Body>,
  pub mockable: bool,
}
