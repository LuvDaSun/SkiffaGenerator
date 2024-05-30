use super::*;
use crate::utils::NodeRc;

#[derive(Clone)]
pub enum NodeOrReference<T>
where
  T: From<NodeRc>,
{
  Node(T),
  Reference(String),
}

impl<T> NodeOrReference<T>
where
  T: From<NodeRc>,
{
  pub fn to_node(self) -> Option<T> {
    match self {
      NodeOrReference::Node(node) => Some(node),
      NodeOrReference::Reference(_) => None,
    }
  }
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
