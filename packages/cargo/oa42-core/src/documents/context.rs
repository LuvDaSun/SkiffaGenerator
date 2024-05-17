use super::SpecificationDocumentType;
use crate::documents::{Oas30Document, Oas31Document, Swagger2Document};
use crate::error::Error;
use crate::{models::Api, utils::DocumentContext};
use std::rc::Rc;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct SpecificationDocumentContext(Rc<DocumentContext<SpecificationDocumentType, Api>>);

#[wasm_bindgen]
impl SpecificationDocumentContext {
  #[wasm_bindgen(constructor)]
  pub fn new() -> Self {
    let context = DocumentContext::new();
    Self(context)
  }

  #[wasm_bindgen(js_name = "registerWellKnownFactories")]
  pub fn register_well_known_factories(&mut self) -> Result<(), Error> {
    self.0.register_factory(
      SpecificationDocumentType::Swagger2,
      Box::new(|_context, _configuration| Swagger2Document::new()),
    )?;
    self.0.register_factory(
      SpecificationDocumentType::OpenApiV30,
      Box::new(|_context, _configuration| Oas30Document::new()),
    )?;
    self.0.register_factory(
      SpecificationDocumentType::OpenApiV31,
      Box::new(|_context, _configuration| Oas31Document::new()),
    )?;

    Ok(())
  }
}
