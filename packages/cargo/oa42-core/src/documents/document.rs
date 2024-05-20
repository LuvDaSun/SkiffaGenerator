use crate::utils::{NodeLocation, NodeRc};

pub trait Document {
  fn get_consequent_locations(&self) -> Vec<NodeLocation>;
}

pub struct DocumentConfiguration {
  pub retrieval_location: NodeLocation,
  pub document_node: NodeRc,
}

pub type DocumentFactory = Box<dyn Fn(DocumentConfiguration) -> Box<dyn Document>>;
