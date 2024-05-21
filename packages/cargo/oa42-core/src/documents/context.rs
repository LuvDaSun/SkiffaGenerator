use super::document::DocumentFactory;
use super::{DocumentTrait, DocumentType};
use crate::documents::DocumentConfiguration;
use crate::documents::{oas30, oas31, swagger2};
use crate::error::Error;
use crate::models;
use crate::utils::{NodeCache, NodeLocation, NodeRc};
use std::cell::RefCell;
use std::collections::BTreeMap;
use std::rc::Rc;
use wasm_bindgen::prelude::*;

pub struct DocumentContext {
  cache: RefCell<NodeCache>,
  /**
   * document factories by document type key
   */
  factories: RefCell<BTreeMap<DocumentType, DocumentFactory>>,
  documents: RefCell<BTreeMap<NodeLocation, Box<dyn DocumentTrait>>>,
}

impl DocumentContext {
  pub fn new(cache: NodeCache) -> Self {
    Self {
      cache: RefCell::new(cache),
      factories: Default::default(),
      documents: Default::default(),
    }
  }

  pub fn register_factory(&self, r#type: DocumentType, factory: DocumentFactory) {
    /*
    don't check if the factory is already registered here so we can
    override factories
    */
    self.factories.borrow_mut().insert(r#type, factory);
  }

  pub fn get_node(&self, retrieval_location: &NodeLocation) -> Option<NodeRc> {
    /*
    don't check if the factory is already registered here so we can
    override factories
    */
    self.cache.borrow().get_node(retrieval_location)
  }
}

#[wasm_bindgen]
pub struct DocumentContextContainer(Rc<DocumentContext>);

#[wasm_bindgen]
impl DocumentContextContainer {
  #[wasm_bindgen(constructor)]
  pub fn new(cache: NodeCache) -> Self {
    Self(Rc::new(DocumentContext::new(cache)))
  }

  #[wasm_bindgen(js_name = "registerWellKnownFactories")]
  pub fn register_well_known_factories(&self) {
    let context = Rc::downgrade(&self.0);
    self.0.register_factory(
      DocumentType::Swagger2,
      Box::new(move |configuration| {
        Box::new(swagger2::Document::new(
          context.clone(),
          configuration.retrieval_location,
        ))
      }),
    );
    let context = Rc::downgrade(&self.0);
    self.0.register_factory(
      DocumentType::OpenApiV30,
      Box::new(move |configuration| {
        Box::new(oas30::Document::new(
          context.clone(),
          configuration.retrieval_location,
        ))
      }),
    );
    let context = Rc::downgrade(&self.0);
    self.0.register_factory(
      DocumentType::OpenApiV31,
      Box::new(move |configuration| {
        Box::new(oas31::Document::new(
          context.clone(),
          configuration.retrieval_location,
        ))
      }),
    );
  }

  #[wasm_bindgen(js_name = "loadFromLocation")]
  pub async fn load_from_location(&self, retrieval_location: NodeLocation) -> Result<(), Error> {
    if self.0.documents.borrow().contains_key(&retrieval_location) {
      return Ok(());
    }

    self
      .0
      .cache
      .borrow_mut()
      .load_from_location(&retrieval_location)
      .await?;

    let node = self
      .0
      .cache
      .borrow()
      .get_node(&retrieval_location)
      .ok_or(Error::NotFound)?;

    let document_type = (&node).try_into()?;

    let document = {
      let factories = self.0.factories.borrow();
      let factory = factories.get(&document_type).ok_or(Error::NotFound)?;
      factory(DocumentConfiguration {
        retrieval_location: retrieval_location.clone(),
      })
    };

    for consequent_location in document.get_consequent_locations() {
      let consequent_retrieval_location = retrieval_location.join(&consequent_location);

      Box::pin(self.load_from_location(consequent_retrieval_location)).await?;
    }

    assert!(self
      .0
      .documents
      .borrow_mut()
      .insert(retrieval_location.clone(), document)
      .is_none());

    Ok(())
  }

  #[wasm_bindgen(js_name = "getApiModel")]
  pub fn get_api_model(&self, retrieval_location: &NodeLocation) -> Option<models::ApiContainer> {
    let documents = self.0.documents.borrow();
    let document = documents.get(retrieval_location)?;
    let api_model = document.get_api_model().unwrap();

    Some(api_model)
  }
}

#[cfg(not(target_os = "unknown"))]
#[cfg(test)]
mod tests {
  use super::NodeCache;
  use super::*;

  #[async_std::test]
  async fn test_oas30() {
    let cache = NodeCache::new();
    let context = DocumentContextContainer::new(cache);
    context.register_well_known_factories();

    let location = NodeLocation::parse("../../../fixtures/specifications/nwd.yaml").unwrap();

    context.load_from_location(location.clone()).await.unwrap();
    let api = context.get_api_model(&location).unwrap();

    assert_eq!(api.location(), location);

    for path in api.paths() {
      assert!(path.id() > 0);
      for operation in path.operations() {
        operation.name();
      }
    }
  }
}
