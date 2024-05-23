use super::*;
use crate::{
  documents::{AsNode, GetSchemaLocations},
  models,
  utils::{NodeLocation, NodeRc},
};
use std::collections::BTreeMap;

#[derive(Clone)]
pub struct ResponseHeader(NodeRc);

impl ResponseHeader {
  pub fn schema_pointer(&self) -> Option<Vec<String>> {
    self
      .0
      .as_object()?
      .get("schema")
      .map(|_value| vec!["schema".to_owned()])
  }

  pub fn required(&self) -> Option<bool> {
    self.0.as_object()?.get("required")?.as_bool()
  }
}

impl From<NodeRc> for ResponseHeader {
  fn from(value: NodeRc) -> Self {
    Self(value)
  }
}

impl AsNode<Self> for ResponseHeader {
  fn as_node(&self) -> Option<&Self> {
    Some(self)
  }
}

impl GetSchemaLocations for ResponseHeader {
  fn get_schema_locations(&self, location: &NodeLocation) -> Vec<NodeLocation> {
    self
      .schema_pointer()
      .into_iter()
      .map(|pointer| location.push_pointer(pointer))
      .collect()
  }
}
