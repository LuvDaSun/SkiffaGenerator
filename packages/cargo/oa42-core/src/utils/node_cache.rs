use super::{fetch_file, Node, NodeLocation, NodeRc};
use crate::error::Error;
use std::collections::BTreeMap;
use std::iter::once;
use std::rc::Rc;
use wasm_bindgen::prelude::*;

/// Caches nodes (json / yaml) and indexes the nodes by their location.
/// Nodes have a retrieval location that is the physical (possibly globally
/// unique) location of the node.
///
#[wasm_bindgen]
pub struct NodeCache {
  nodes: BTreeMap<NodeLocation, NodeRc>,
}

impl NodeCache {
  pub fn new() -> Self {
    Self {
      nodes: Default::default(),
    }
  }

  /// Retrieves the node
  ///
  pub fn get_node(&self, retrieval_location: &NodeLocation) -> Option<NodeRc> {
    self.nodes.get(retrieval_location).cloned()
  }

  /// Load nodes from a location. The retrieval location is the physical location of
  /// the node, it should be a root location
  ///
  pub async fn load_from_location(
    &mut self,
    retrieval_location: &NodeLocation,
  ) -> Result<(), Error> {
    /*
    If the document is not in the cache
    */
    if !self.nodes.contains_key(retrieval_location) {
      /*
      retrieve the document
      */
      let retrieval_location = retrieval_location.set_root();
      let fetch_location = retrieval_location.to_fetch_string();
      let data = fetch_file(&fetch_location).await?;
      let document_node = serde_yaml::from_str(&data)?;
      let document_node = Rc::new(document_node);

      /*
      populate the cache with this document
      */
      self.fill_node_cache(&retrieval_location, document_node)?;
    }

    Ok(())
  }

  pub async fn load_from_node(
    &mut self,
    retrieval_location: &NodeLocation,
    node: NodeRc,
  ) -> Result<(), Error> {
    self.fill_node_cache(retrieval_location, node)?;

    Ok(())
  }

  /// the retrieval location is the location of the document node. The document
  /// node may be a part of a bigger document, if this is the case then it's
  /// retrieval location is not root.
  ///
  fn fill_node_cache(
    &mut self,
    retrieval_location: &NodeLocation,
    node: NodeRc,
  ) -> Result<(), Error> {
    let mut queue = Vec::new();
    queue.push((retrieval_location.clone(), node));

    while let Some((retrieval_location, node)) = queue.pop() {
      if let Some(node_previous) = self.nodes.get(&retrieval_location) {
        if node != *node_previous {
          Err(Error::NotTheSame)?
        }
      } else {
        match &*node {
          Node::Array(array_node) => {
            for (index, item_node) in array_node.into_iter().enumerate() {
              queue.push((
                retrieval_location.push_pointer(once(index.to_string()).collect()),
                item_node.clone(),
              ))
            }
          }

          Node::Object(object_node) => {
            for (name, item_node) in object_node {
              queue.push((
                retrieval_location.push_pointer(once(name.to_string()).collect()),
                item_node.clone(),
              ))
            }
          }

          _ => {}
        }

        assert!(self.nodes.insert(retrieval_location, node).is_none());
      }
    }

    Ok(())
  }
}

#[cfg(test)]
mod tests {

  #[test]
  fn test_1() {
    //
  }
}
