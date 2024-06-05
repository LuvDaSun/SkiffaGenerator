use super::*;
use crate::models;
use std::collections::BTreeMap;

#[derive(Clone)]
pub struct Path(serde_json::Value);

impl Path {
  pub fn operations(&self) -> Option<BTreeMap<Vec<String>, Operation>> {
    Some(
      self
        .0
        .as_object()?
        .into_iter()
        .filter(|(key, _node)| models::Method::try_from(key.as_str()).is_ok())
        .map(|(key, node)| (vec![key.clone()], node.clone().into()))
        .collect(),
    )
  }

  pub fn request_parameters(
    &self,
  ) -> Option<BTreeMap<Vec<String>, NodeOrReference<RequestParameter>>> {
    let member = "parameters";
    Some(
      self
        .0
        .as_object()?
        .get(member)?
        .as_array()?
        .iter()
        .enumerate()
        .map(|(key, node)| {
          (
            vec![member.to_owned(), key.to_string()],
            node.clone().into(),
          )
        })
        .collect(),
    )
  }
}

impl From<serde_json::Value> for Path {
  fn from(value: serde_json::Value) -> Self {
    Self(value)
  }
}
