use super::interface::DocumentFactory;
use super::{DocumentInterface, DocumentType};
use crate::documents::DocumentConfiguration;
use crate::documents::{oas30, oas31, swagger2};
use crate::error::Error;
use crate::models;
use crate::utils::{NodeCache, NodeLocation};
use std::cell::RefCell;
use std::collections::BTreeMap;
use std::rc;
use wasm_bindgen::prelude::*;

#[derive(Default)]
pub struct DocumentContext {
  cache: rc::Rc<RefCell<NodeCache>>,
  /**
   * document factories by document type key
   */
  factories: RefCell<BTreeMap<DocumentType, DocumentFactory>>,
  documents: RefCell<BTreeMap<NodeLocation, Box<dyn DocumentInterface>>>,
}

impl DocumentContext {
  pub fn new() -> Self {
    Self::default()
  }

  pub fn register_factory(&self, r#type: DocumentType, factory: DocumentFactory) {
    /*
    don't check if the factory is already registered here so we can
    override factories
    */
    self.factories.borrow_mut().insert(r#type, factory);
  }

  pub fn get_node(&self, retrieval_location: &NodeLocation) -> Option<serde_json::Value> {
    self.cache.borrow().get_node(retrieval_location).cloned()
  }
}

#[wasm_bindgen]
#[derive(Default)]
pub struct DocumentContextContainer(rc::Rc<DocumentContext>);

#[wasm_bindgen]
impl DocumentContextContainer {
  #[wasm_bindgen(constructor)]
  pub fn new() -> Self {
    Self::default()
  }

  #[wasm_bindgen(js_name = "registerWellKnownFactories")]
  pub fn register_well_known_factories(&self) {
    let context = rc::Rc::downgrade(&self.0);
    self.0.register_factory(
      DocumentType::Swagger2,
      Box::new(move |configuration| {
        Box::new(swagger2::Document::new(
          context.clone(),
          configuration.retrieval_location,
        ))
      }),
    );
    let context = rc::Rc::downgrade(&self.0);
    self.0.register_factory(
      DocumentType::OpenApiV30,
      Box::new(move |configuration| {
        Box::new(oas30::Document::new(
          context.clone(),
          configuration.retrieval_location,
        ))
      }),
    );
    let context = rc::Rc::downgrade(&self.0);
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
  #[allow(clippy::await_holding_refcell_ref)]
  pub async fn load_from_location(&self, retrieval_location: &str) -> Result<(), Error> {
    let retrieval_location = retrieval_location.parse().unwrap();
    let mut queue = Vec::new();
    queue.push(retrieval_location);

    while let Some(retrieval_location) = queue.pop() {
      if self.0.documents.borrow().contains_key(&retrieval_location) {
        continue;
      }

      self
        .0
        .cache
        .borrow_mut()
        .load_from_location(&retrieval_location)
        .await?;

      let document_type = self
        .0
        .cache
        .borrow()
        .get_node(&retrieval_location)
        .ok_or(Error::NotFound)?
        .try_into()?;

      let document = {
        let factories = self.0.factories.borrow();
        let factory = factories.get(&document_type).ok_or(Error::NotFound)?;
        factory(DocumentConfiguration {
          retrieval_location: retrieval_location.clone(),
        })
      };

      for referenced_location in document.get_referenced_locations()? {
        let referenced_retrieval_location = retrieval_location.join(&referenced_location);

        queue.push(referenced_retrieval_location);
      }

      assert!(self
        .0
        .documents
        .borrow_mut()
        .insert(retrieval_location.clone(), document)
        .is_none());
    }

    Ok(())
  }

  #[wasm_bindgen(js_name = "getApiModel")]
  pub fn get_api_model(&self, retrieval_location: &str) -> Option<models::ApiContainer> {
    let retrieval_location = retrieval_location.parse().unwrap();
    let documents = self.0.documents.borrow();
    let document = documents.get(&retrieval_location)?;
    let api_model = document.get_api_model().unwrap();

    Some(api_model.into())
  }

  #[wasm_bindgen(js_name = "getSchemas")]
  pub fn get_schemas(&self) -> Vec<DocumentSchemaContainer> {
    let documents = self.0.documents.borrow();
    documents
      .values()
      .flat_map(|document| {
        document
          .get_schema_locations()
          .into_iter()
          .flatten()
          .map(|schema_location| {
            rc::Rc::new(DocumentSchema {
              schema_location,
              document_location: document.get_document_location(),
              default_schema_id: document.get_default_schema_id(),
            })
            .into()
          })
      })
      .collect()
  }
}

pub struct DocumentSchema {
  pub schema_location: NodeLocation,
  pub document_location: NodeLocation,
  pub default_schema_id: String,
}

#[wasm_bindgen]
#[derive(Clone)]
pub struct DocumentSchemaContainer(rc::Rc<DocumentSchema>);

#[wasm_bindgen]
impl DocumentSchemaContainer {
  #[wasm_bindgen(getter = schemaLocation)]
  pub fn schema_location(&self) -> String {
    self.0.schema_location.to_string()
  }

  #[wasm_bindgen(getter = documentLocation)]
  pub fn document_location(&self) -> String {
    self.0.document_location.to_string()
  }

  #[wasm_bindgen(getter = defaultSchemaId)]
  pub fn default_schema_id(&self) -> String {
    self.0.default_schema_id.clone()
  }
}

impl From<rc::Rc<DocumentSchema>> for DocumentSchemaContainer {
  fn from(interior: rc::Rc<DocumentSchema>) -> Self {
    Self(interior)
  }
}

#[cfg(not(target_os = "unknown"))]
#[cfg(test)]
mod tests {
  use super::*;

  #[tokio::test]
  async fn test_oas30() {
    let context = DocumentContextContainer::default();
    context.register_well_known_factories();

    let location = "../../../fixtures/specifications/echo.yaml";

    context.load_from_location(location).await.unwrap();
    let api = context.get_api_model(location).unwrap();

    assert_eq!(api.location(), location.to_string());

    for path in api.paths() {
      assert!(path.id() > 0);
      for operation in path.operations() {
        for parameter in operation.query_parameters() {
          parameter.name();
        }
      }
    }
  }
}
