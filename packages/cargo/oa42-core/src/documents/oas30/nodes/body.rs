use crate::{models, utils::NodeRc};
use std::collections::BTreeMap;
use super::*;

#[derive(Clone)]
pub struct Body(NodeRc);

impl Body {
  pub fn schema_pointer(&self) -> Option<Vec<String>> {
    self
      .0
      .as_object()?
      .get("schema")
      .map(|_value| vec!["schema".to_owned()])
  }
}

impl From<NodeRc> for Body {
  fn from(value: NodeRc) -> Self {
    Self(value)
  }
}

