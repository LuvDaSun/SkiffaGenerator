use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct AuthenticationRequirement {
  pub authentication_name: String,
  pub scopes: Vec<String>,
}
