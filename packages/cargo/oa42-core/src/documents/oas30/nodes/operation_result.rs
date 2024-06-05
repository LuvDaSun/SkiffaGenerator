use super::*;

use std::collections::BTreeMap;

#[derive(Clone)]
pub struct OperationResult(serde_json::Value);

impl OperationResult {
  pub fn description(&self) -> Option<&str> {
    self.0.as_object()?.get("description")?.as_str()
  }

  pub fn response_headers(&self) -> Option<BTreeMap<Vec<String>, NodeOrReference<ResponseHeader>>> {
    let member = "headers";
    Some(
      self
        .0
        .as_object()?
        .get(member)?
        .as_object()?
        .into_iter()
        .map(|(key, node)| {
          (
            vec![member.to_owned(), key.to_string()],
            node.clone().into(),
          )
        })
        .collect(),
    )
  }

  pub fn bodies(&self) -> Option<BTreeMap<Vec<String>, Body>> {
    let member = "content";
    Some(
      self
        .0
        .as_object()?
        .get(member)?
        .as_object()?
        .into_iter()
        .map(|(key, node)| (vec![member.to_owned(), key.clone()], node.clone().into()))
        .collect(),
    )
  }
}

impl From<serde_json::Value> for OperationResult {
  fn from(value: serde_json::Value) -> Self {
    Self(value)
  }
}
