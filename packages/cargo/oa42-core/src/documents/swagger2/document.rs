use crate::{
  documents::SpecificationDocumentType,
  models::Api,
  utils::{Document, DocumentContext, EmbeddedDocument, NodeLocation, NodeRc, ReferencedDocument},
};
use std::{
  collections::HashMap,
  rc::{Rc, Weak},
};

pub struct SpecificationDocument {
  _document_context: Weak<DocumentContext<SpecificationDocumentType, Api>>,

  document_location: NodeLocation,
  antecedent_location: Option<NodeLocation>,

  /**
  Nodes that belong to this document, indexed by their (sub)pointer
  */
  _nodes: HashMap<Vec<String>, NodeRc>,
  referenced_documents: Vec<ReferencedDocument>,
  embedded_documents: Vec<EmbeddedDocument>,
}

impl SpecificationDocument {
  pub fn new(
    document_context: Weak<DocumentContext<SpecificationDocumentType, Api>>,
    retrieval_location: NodeLocation,
    _given_location: NodeLocation,
    antecedent_location: Option<NodeLocation>,
    _document_node: NodeRc,
  ) -> Rc<Self> {
    Rc::new(Self {
      _document_context: document_context,
      document_location: retrieval_location,
      antecedent_location: antecedent_location,

      embedded_documents: Default::default(),
      referenced_documents: Default::default(),

      _nodes: Default::default(),
    })
  }
}

impl Document<Api> for SpecificationDocument {
  fn get_referenced_documents(&self) -> &Vec<ReferencedDocument> {
    &self.referenced_documents
  }

  fn get_embedded_documents(&self) -> &Vec<EmbeddedDocument> {
    &self.embedded_documents
  }

  fn get_document_location(&self) -> &NodeLocation {
    &self.document_location
  }

  fn get_antecedent_location(&self) -> Option<&NodeLocation> {
    self.antecedent_location.as_ref()
  }

  fn get_node_locations(&self) -> Vec<NodeLocation> {
    Default::default()
  }

  fn get_intermediate_documents(&self) -> std::collections::BTreeMap<NodeLocation, Api> {
    Default::default()
  }

  fn resolve_anchor(&self, _anchor: &str) -> Option<Vec<String>> {
    Default::default()
  }

  fn resolve_antecedent_anchor(&self, _anchor: &str) -> Option<Vec<String>> {
    Default::default()
  }
}
