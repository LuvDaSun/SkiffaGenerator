use crate::{
  models::Api,
  utils::{Document, EmbeddedDocument, NodeLocation, ReferencedDocument},
};
use std::rc::Rc;

pub struct Oas30Document {
  //
}

impl Oas30Document {
  pub fn new() -> Rc<Self> {
    Rc::new(Self {})
  }
}

impl Document<Api> for Oas30Document {
  fn get_referenced_documents(&self) -> &Vec<ReferencedDocument> {
    todo!()
  }

  fn get_embedded_documents(&self) -> &Vec<EmbeddedDocument> {
    todo!()
  }

  fn get_document_location(&self) -> &NodeLocation {
    todo!()
  }

  fn get_antecedent_location(&self) -> Option<&NodeLocation> {
    todo!()
  }

  fn get_node_locations(&self) -> Vec<NodeLocation> {
    todo!()
  }

  fn get_intermediate_documents(&self) -> std::collections::BTreeMap<NodeLocation, Api> {
    todo!()
  }

  fn resolve_anchor(&self, anchor: &str) -> Option<Vec<String>> {
    todo!()
  }

  fn resolve_antecedent_anchor(&self, anchor: &str) -> Option<Vec<String>> {
    todo!()
  }
}
