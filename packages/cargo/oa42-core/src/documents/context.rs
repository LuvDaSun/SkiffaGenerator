use super::document::DocumentFactory;
use super::{Document, DocumentType};
use crate::documents::DocumentConfiguration;
use crate::documents::{oas30, oas31, swagger2};
use crate::error::Error;
use crate::utils::{NodeCache, NodeLocation};
use std::cell::RefCell;
use std::collections::BTreeMap;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct DocumentContext {
  cache: RefCell<NodeCache>,
  /**
   * document factories by document type key
   */
  factories: RefCell<BTreeMap<DocumentType, DocumentFactory>>,
  documents: RefCell<BTreeMap<NodeLocation, Box<dyn Document>>>,
}

impl DocumentContext {
  pub fn register_factory(&self, r#type: DocumentType, factory: DocumentFactory) {
    /*
    don't check if the factory is already registered here so we can
    override factories
    */
    self.factories.borrow_mut().insert(r#type, factory);
  }
}

#[wasm_bindgen]
impl DocumentContext {
  #[wasm_bindgen(constructor)]
  pub fn new(cache: NodeCache) -> Self {
    Self {
      cache: RefCell::new(cache),
      factories: Default::default(),
      documents: Default::default(),
    }
  }

  #[wasm_bindgen(js_name = "registerWellKnownFactories")]
  pub fn register_well_known_factories(&self) {
    self.register_factory(
      DocumentType::Swagger2,
      Box::new(|configuration| {
        Box::new(swagger2::SpecificationDocument::new(
          configuration.retrieval_location,
          configuration.document_node,
        ))
      }),
    );
    self.register_factory(
      DocumentType::OpenApiV30,
      Box::new(|configuration| {
        Box::new(oas30::SpecificationDocument::new(
          configuration.retrieval_location,
          configuration.document_node,
        ))
      }),
    );
    self.register_factory(
      DocumentType::OpenApiV31,
      Box::new(|configuration| {
        Box::new(oas31::SpecificationDocument::new(
          configuration.retrieval_location,
          configuration.document_node,
        ))
      }),
    );
  }

  #[wasm_bindgen(js_name = "loadFromLocation")]
  pub async fn load_from_location(&self, retrieval_location: NodeLocation) -> Result<(), Error> {
    if self.documents.borrow().contains_key(&retrieval_location) {
      return Ok(());
    }

    self
      .cache
      .borrow_mut()
      .load_from_location(&retrieval_location)
      .await?;

    let node = self
      .cache
      .borrow()
      .get_node(&retrieval_location)
      .ok_or(Error::NotFound)?;

    let document_type = (&node).try_into()?;

    let document = {
      let factories = self.factories.borrow();
      let factory = factories.get(&document_type).ok_or(Error::NotFound)?;
      factory(DocumentConfiguration {
        retrieval_location: retrieval_location.clone(),
        document_node: node,
      })
    };

    for consequent_location in document.get_consequent_locations() {
      let consequent_retrieval_location = retrieval_location.join(&consequent_location);

      Box::pin(self.load_from_location(consequent_retrieval_location)).await?;
    }

    assert!(self
      .documents
      .borrow_mut()
      .insert(retrieval_location.clone(), document)
      .is_none());

    Ok(())
  }
}
