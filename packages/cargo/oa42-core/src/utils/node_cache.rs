use super::{fetch_text, FetchTextError, NodeLocation};
use std::collections::{btree_map, BTreeMap};
use std::iter;

/// Caches nodes (json / yaml) and indexes the nodes by their location.
/// Nodes have a retrieval location that is the physical (possibly globally
/// unique) location of the node.
///
#[derive(Default)]
pub struct NodeCache {
  root_nodes: BTreeMap<NodeLocation, serde_json::Value>,
}

impl NodeCache {
  pub fn new() -> Self {
    Default::default()
  }

  /// Retrieves all locations in the cache
  ///
  pub fn get_locations(&self) -> impl Iterator<Item = NodeLocation> + '_ {
    self.root_nodes.iter().flat_map(|(location, node)| {
      iter::once(location.clone())
        .chain(Self::get_child_pointers(node).map(|pointer| location.set_pointer(pointer)))
    })
  }

  ///.Retrieves a list of nodes with the node at the retrieval location last,
  /// and all of the ancestors of the node before. The root node is first.
  ///
  /// Returns an empty vec when the node is not found.
  ///
  pub fn get_node_with_ancestors(
    &self,
    retrieval_location: &NodeLocation,
  ) -> Vec<(NodeLocation, &serde_json::Value)> {
    let mut location = retrieval_location.set_root();
    let pointer = retrieval_location.get_pointer().unwrap_or_default();
    self
      .get_node_path_with_member(&location, pointer.clone())
      .unwrap_or_default()
      .into_iter()
      .enumerate()
      .map(|(index, node)| {
        if index > 0 {
          location = location.push_pointer(pointer[0..index - 1].to_vec());
        }
        (location.clone(), node)
      })
      .collect()
  }

  /// Retrieves the node
  ///
  pub fn get_node(&self, retrieval_location: &NodeLocation) -> Option<&serde_json::Value> {
    let root_location = retrieval_location.set_root();
    let pointer = retrieval_location.get_pointer().unwrap_or_default();
    let mut nodes = self.get_node_path_with_member(&root_location, pointer)?;

    nodes.pop()
  }

  /// Load nodes from a location. The retrieval location is the physical location of
  /// the node, it should be a root location
  ///
  pub async fn load_from_location(
    &mut self,
    retrieval_location: &NodeLocation,
  ) -> Result<(), NodeCacheError> {
    let root_location = retrieval_location.set_root();

    /*
    If the document is not in the cache
    */
    if let btree_map::Entry::Vacant(entry) = self.root_nodes.entry(root_location) {
      /*
      retrieve the document
      */
      let data = fetch_text(&entry.key().to_fetch_string()).await?;
      let root_node = serde_yaml::from_str(&data)?;

      /*
      populate the cache with this document
      */
      entry.insert(root_node);
    }

    Ok(())
  }

  pub fn load_from_node(
    &mut self,
    retrieval_location: &NodeLocation,
    node: serde_json::Value,
  ) -> Result<(), NodeCacheError> {
    /*
    If the document is not in the cache
    */
    if let btree_map::Entry::Vacant(entry) = self.root_nodes.entry(retrieval_location.clone()) {
      /*
      populate the cache with this document
      */
      entry.insert(node);
      Ok(())
    } else {
      Err(NodeCacheError::Conflict)
    }
  }

  fn get_node_path_with_member(
    &self,
    root_location: &NodeLocation,
    pointer: Vec<String>,
  ) -> Option<Vec<&serde_json::Value>> {
    let mut result = Vec::new();
    let mut node = self.root_nodes.get(root_location)?;

    result.push(node);

    for member in pointer {
      match node {
        serde_json::Value::Array(array_node) => {
          let index: usize = member.parse().ok()?;
          node = array_node.get(index)?;
        }
        serde_json::Value::Object(object_node) => {
          node = object_node.get(&member)?;
        }
        _ => return None,
      }
      result.push(node);
    }

    Some(result)
  }

  fn get_child_pointers(node: &serde_json::Value) -> impl Iterator<Item = Vec<String>> {
    let mut result = Vec::new();

    match node {
      serde_json::Value::Array(array_node) => {
        for index in 0..array_node.len() {
          let member = index.to_string();
          result.push(iter::once(member.clone()).collect());
          for pointer in Self::get_child_pointers(node) {
            result.push(iter::once(member.clone()).chain(pointer).collect());
          }
        }
      }
      serde_json::Value::Object(object_node) => {
        for key in object_node.keys() {
          let member = key.to_owned();
          result.push(iter::once(member.clone()).collect());
          for pointer in Self::get_child_pointers(node) {
            result.push(iter::once(member.clone()).chain(pointer).collect());
          }
        }
      }
      _ => {}
    }

    result.into_iter()
  }
}

#[derive(Debug)]
pub enum NodeCacheError {
  SerializationError,
  Conflict,
  FetchError,
}

impl From<FetchTextError> for NodeCacheError {
  fn from(value: FetchTextError) -> Self {
    match value {
      FetchTextError::IoError => Self::FetchError,
      FetchTextError::HttpError => Self::FetchError,
    }
  }
}

impl From<serde_yaml::Error> for NodeCacheError {
  fn from(_value: serde_yaml::Error) -> Self {
    Self::SerializationError
  }
}

#[cfg(not(target_os = "unknown"))]
#[cfg(test)]
mod tests {
  use super::*;

  #[tokio::test]
  async fn test_load_from_location() {
    let mut cache = NodeCache::new();

    let location: NodeLocation = "../../../fixtures/specification/nwd.yaml".parse().unwrap();

    cache.load_from_location(&location).await.unwrap();

    cache.get_node(&location).unwrap();

    cache
      .get_node(&location.set_pointer(vec!["definitions".into(), "main-category".into()]))
      .unwrap();

    let node = cache
      .get_node(&location.set_pointer(vec![
        "definitions".into(),
        "main-category".into(),
        "description".into(),
      ]))
      .unwrap();
    assert_eq!(
      *node,
      serde_json::Value::String("Full main category entity".into())
    );
  }
}
