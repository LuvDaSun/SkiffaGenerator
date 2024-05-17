use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct AuthenticationRequirement {
  authentication_name: String,
  scopes: Vec<String>,
}
