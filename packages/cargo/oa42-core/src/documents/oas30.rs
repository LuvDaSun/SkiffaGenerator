use crate::{models::IntermediateDocument, utils::Document};
use std::rc::Rc;

pub struct Oas30Document {
  //
}

impl Oas30Document {
  pub fn new() -> Rc<Self> {
    Rc::new(Self {})
  }
}

impl Document<IntermediateDocument> for Oas30Document {
  fn get_referenced_documents(&self) -> &Vec<crate::utils::ReferencedDocument> {
    todo!()
  }

  fn get_embedded_documents(&self) -> &Vec<crate::utils::EmbeddedDocument> {
    todo!()
  }

  fn get_document_location(&self) -> &crate::utils::NodeLocation {
    todo!()
  }

  fn get_antecedent_location(&self) -> Option<&crate::utils::NodeLocation> {
    todo!()
  }

  fn get_node_locations(&self) -> Vec<crate::utils::NodeLocation> {
    todo!()
  }

  fn get_intermediate_documents(
    &self,
  ) -> std::collections::BTreeMap<crate::utils::NodeLocation, IntermediateDocument> {
    todo!()
  }

  fn resolve_anchor(&self, anchor: &str) -> Option<Vec<String>> {
    todo!()
  }

  fn resolve_antecedent_anchor(&self, anchor: &str) -> Option<Vec<String>> {
    todo!()
  }
}
