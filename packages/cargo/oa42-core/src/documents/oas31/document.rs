use crate::{
  documents::Document,
  utils::{NodeLocation, NodeRc},
};
use std::collections::HashMap;

pub struct SpecificationDocument {
  retrieval_location: NodeLocation,

  /**
  Nodes that belong to this document, indexed by their (sub)pointer
  */
  _nodes: HashMap<Vec<String>, NodeRc>,
}

impl SpecificationDocument {
  pub fn new(retrieval_location: NodeLocation, _document_node: NodeRc) -> Self {
    Self {
      retrieval_location,

      _nodes: Default::default(),
    }
  }
}

impl Document for SpecificationDocument {
  fn get_consequent_locations(&self) -> Vec<NodeLocation> {
    Default::default()
  }
}
