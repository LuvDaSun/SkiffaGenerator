use super::*;
use crate::{
  documents::{oas30::ToNode, GetSchemaLocations},
  utils::{NodeLocation, NodeRc},
};

#[derive(Clone)]
pub enum NodeOrReference<T>
where
  T: From<NodeRc>,
{
  Node(T),
  Reference(String),
}

impl<T> From<NodeRc> for NodeOrReference<T>
where
  T: From<NodeRc>,
{
  fn from(value: NodeRc) -> Self {
    let reference_node: Reference = value.clone().into();
    if let Some(reference) = reference_node.reference() {
      return NodeOrReference::Reference(reference.to_owned());
    }
    NodeOrReference::Node(value.into())
  }
}

impl<T> GetSchemaLocations for NodeOrReference<T>
where
  T: From<NodeRc> + GetSchemaLocations,
{
  fn get_schema_locations(&self, location: &NodeLocation) -> Vec<NodeLocation> {
    match self {
      NodeOrReference::Node(node) => node.get_schema_locations(location),
      NodeOrReference::Reference(_) => Vec::new(),
    }
  }
}

impl<T> ToNode<T> for NodeOrReference<T>
where
  T: From<NodeRc>,
{
  fn to_node(self) -> Option<T> {
    match self {
      NodeOrReference::Node(node) => Some(node),
      NodeOrReference::Reference(_) => None,
    }
  }
}
