use super::{Node, NodeRc};
use std::iter::once;

#[deprecated]
pub fn read_node(prefix: &[String], node: NodeRc) -> Vec<(Vec<String>, NodeRc)> {
  match &*node {
    Node::Array(array_value) => once((prefix.to_owned(), node.clone()))
      .chain(
        array_value
          .iter()
          .enumerate()
          .flat_map(|(index, element_value)| {
            read_node(
              &prefix
                .iter()
                .cloned()
                .chain(once(index.to_string()))
                .collect::<Vec<_>>(),
              element_value.clone(),
            )
          }),
      )
      .collect(),
    Node::Object(object_value) => once((prefix.to_owned(), node.clone()))
      .chain(object_value.iter().flat_map(|(name, element_value)| {
        read_node(
          &prefix
            .iter()
            .cloned()
            .chain(once(name.to_string()))
            .collect::<Vec<_>>(),
          element_value.clone(),
        )
      }))
      .collect(),
    _ => once((prefix.to_owned(), node)).collect(),
  }
}
