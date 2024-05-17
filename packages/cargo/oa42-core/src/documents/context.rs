use super::SpecificationDocumentType;
use crate::utils::DocumentContext;
use std::rc::Rc;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct SpecificationDocumentContext(Rc<DocumentContext<SpecificationDocumentType, usize>>);

#[wasm_bindgen]
impl SpecificationDocumentContext {
  #[wasm_bindgen(constructor)]
  pub fn new() -> Self {
    Self(DocumentContext::new())
  }
}
