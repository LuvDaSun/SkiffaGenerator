use super::*;

#[derive(Clone)]
pub enum NodeOrReference<T>
where
  T: From<serde_json::Value>,
{
  Node(T),
  Reference(String),
}

impl<T> NodeOrReference<T>
where
  T: From<serde_json::Value>,
{
  pub fn into_node(self) -> Option<T> {
    match self {
      NodeOrReference::Node(node) => Some(node),
      NodeOrReference::Reference(_) => None,
    }
  }
}

impl<T> From<serde_json::Value> for NodeOrReference<T>
where
  T: From<serde_json::Value>,
{
  fn from(value: serde_json::Value) -> Self {
    let reference_node: Reference = value.clone().into();
    if let Some(reference) = reference_node.reference() {
      return NodeOrReference::Reference(reference.to_owned());
    }
    NodeOrReference::Node(value.into())
  }
}
