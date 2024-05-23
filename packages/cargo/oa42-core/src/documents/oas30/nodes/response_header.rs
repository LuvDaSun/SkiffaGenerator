use super::*;
use crate::{models, utils::NodeRc};
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
