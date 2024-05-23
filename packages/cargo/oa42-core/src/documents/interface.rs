use super::DocumentError;
use crate::{models, utils::NodeLocation};
use std::iter;

pub trait DocumentInterface {
  fn get_referenced_locations(&self) -> Result<Vec<NodeLocation>, DocumentError>;
  fn get_api_model(&self) -> Result<models::ApiContainer, DocumentError>;
}

pub struct DocumentConfiguration {
  pub retrieval_location: NodeLocation,
}

pub type DocumentFactory = Box<dyn Fn(DocumentConfiguration) -> Box<dyn DocumentInterface>>;

pub trait GetReferencedLocations {
  fn get_referenced_locations(&self) -> Result<Vec<NodeLocation>, DocumentError>;
}

pub trait GetSchemaLocations {
  fn get_schema_locations(&self, location: &NodeLocation) -> Vec<NodeLocation>;
}

pub(crate) fn collect_schema_locations<N>(
  nodes: Option<impl iter::IntoIterator<Item = (Vec<String>, impl AsNode<N>)>>,
  location: &NodeLocation,
) -> Vec<NodeLocation>
where
  N: GetSchemaLocations + Clone,
{
  nodes
    .into_iter()
    .flatten()
    .filter_map(|(pointer, node)| node.as_node().map(|node| (pointer, node.clone())))
    .flat_map(|(pointer, node)| {
      let location = location.push_pointer(pointer);
      node.get_schema_locations(&location)
    })
    .collect()
}

pub trait AsNode<T> {
  fn as_node(&self) -> Option<&T>;
}
