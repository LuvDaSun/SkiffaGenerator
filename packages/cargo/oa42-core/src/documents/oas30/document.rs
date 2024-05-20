use super::{ApiNode, PathNode};
use crate::{
  documents::{DocumentContext, DocumentTrait},
  models,
  utils::NodeLocation,
};
use std::rc::Weak;

pub struct Document {
  context: Weak<DocumentContext>,
  retrieval_location: NodeLocation,
}

impl Document {
  pub fn new(context: Weak<DocumentContext>, retrieval_location: NodeLocation) -> Self {
    Self {
      context,
      retrieval_location,
    }
  }

  fn make_api_model(&self, location: NodeLocation) -> models::ApiContainer {
    let context = self.context.upgrade().unwrap();
    let node = context.get_node(&location).unwrap();
    let node: ApiNode = node.into();

    let interior = models::Api {
      location,
      paths: Vec::new(),
    };
    models::ApiContainer::new(interior)
  }

  fn make_path_model(&self, location: NodeLocation, index: usize) -> models::PathContainer {
    let context = self.context.upgrade().unwrap();
    let node = context.get_node(&location).unwrap();
    let node: PathNode = node.into();

    let pattern = location.get_pointer().unwrap().into_iter().last().unwrap();

    let interior = models::Path {
      index,
      location,
      pattern,
      operations: Vec::new(),
    };
    models::PathContainer::new(interior)
  }
}

impl DocumentTrait for Document {
  fn get_consequent_locations(&self) -> Box<dyn Iterator<Item = NodeLocation>> {
    Box::new(Vec::new().into_iter())
  }
}
