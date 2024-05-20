use crate::{
  documents::{DocumentContext, DocumentTrait},
  utils::{NodeLocation, NodeRc},
};
use std::rc::Weak;

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

impl DocumentTrait for Document {
  fn get_consequent_locations(&self) -> Box<dyn Iterator<Item = NodeLocation>> {
    Box::new(Vec::new().into_iter())
  }
}
