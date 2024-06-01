use super::{fetch_text, FetchFileError, Node, NodeLocation, NodeRc};
use std::collections::BTreeMap;
use std::iter::once;
use std::rc::Rc;

/// Caches nodes (json / yaml) and indexes the nodes by their location.
/// Nodes have a retrieval location that is the physical (possibly globally
/// unique) location of the node.
///
pub struct NodeCache {
  nodes: BTreeMap<NodeLocation, NodeRc>,
}

impl NodeCache {
  pub fn new() -> Self {
    Self {
      nodes: Default::default(),
    }
  }
}

impl NodeCache {
  /// Retrieves all locations in the cache
  ///
  pub fn get_locations(&self) -> impl Iterator<Item = &NodeLocation> {
    self.nodes.keys()
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
  ) -> Result<(), NodeCacheError> {
    /*
    If the document is not in the cache
    */
    if !self.nodes.contains_key(retrieval_location) {
      /*
      retrieve the document
      */
      let retrieval_location = retrieval_location.set_root();
      let fetch_location = retrieval_location.to_fetch_string();
      let data = fetch_text(&fetch_location).await?;
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
  ) -> Result<(), NodeCacheError> {
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
  ) -> Result<(), NodeCacheError> {
    let mut queue = Vec::new();
    queue.push((retrieval_location.clone(), node));

    while let Some((retrieval_location, node)) = queue.pop() {
      if let Some(node_previous) = self.nodes.get(&retrieval_location) {
        if node != *node_previous {
          Err(NodeCacheError::NotTheSame)?
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

#[derive(Debug)]
pub enum NodeCacheError {
  NotTheSame,
  InvalidYaml,
  IoError,
  HttpError,
}

impl From<FetchFileError> for NodeCacheError {
  fn from(value: FetchFileError) -> Self {
    match value {
      FetchFileError::IoError => NodeCacheError::IoError,
      FetchFileError::HttpError => NodeCacheError::HttpError,
    }
  }
}

impl From<serde_yaml::Error> for NodeCacheError {
  fn from(_value: serde_yaml::Error) -> Self {
    Self::InvalidYaml
  }
}

#[cfg(not(target_os = "unknown"))]
#[cfg(test)]
mod tests {
  use super::NodeCache;
  use crate::utils::{Node, NodeLocation};

  #[async_std::test]
  async fn test_load_from_location() {
    let mut cache = NodeCache::new();

    let location = NodeLocation::parse("../../../fixtures/specifications/nwd.yaml").unwrap();

    cache.load_from_location(&location).await.unwrap();

    cache.get_node(&location).unwrap();

    cache
      .get_node(&location.set_pointer(vec!["paths".into(), "/me".into()]))
      .unwrap();

    let node = cache
      .get_node(&location.set_pointer(vec![
        "paths".into(),
        "/location/{location-key}".into(),
        "parameters".into(),
        "0".into(),
        "in".into(),
      ]))
      .unwrap();
    assert_eq!(*node, Node::String("path".into()));
  }
}
