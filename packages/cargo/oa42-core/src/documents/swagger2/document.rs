use crate::{
  documents::{DocumentContext, DocumentError, DocumentInterface},
  models,
  utils::{NodeLocation, NodeRc},
};
use std::rc::Weak;

#[allow(dead_code)]
pub struct Document {
  retrieval_location: NodeLocation,
  node: NodeRc,
}

impl Document {
  pub fn new(context: Weak<DocumentContext>, retrieval_location: NodeLocation) -> Self {
    let context = context.upgrade().unwrap();
    let node = context.get_node(&retrieval_location).unwrap();
    Self {
      retrieval_location,
      node,
    }
  }
}

impl DocumentInterface for Document {
  fn get_default_schema_id(&self) -> String {
    "http://swagger.io/v2/schema.json#/definitions/schema".to_owned()
  }

  fn get_document_location(&self) -> NodeLocation {
    self.retrieval_location.clone()
  }

  fn get_api_model(&self) -> Result<models::ApiContainer, DocumentError> {
    todo!()
  }

  fn get_referenced_locations(&self) -> Result<Vec<NodeLocation>, DocumentError> {
    todo!()
  }

  fn get_schema_locations(&self) -> Result<Vec<NodeLocation>, DocumentError> {
    todo!()
  }
}
