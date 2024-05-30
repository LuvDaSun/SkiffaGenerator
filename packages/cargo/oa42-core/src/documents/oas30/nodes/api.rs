use super::*;
use crate::utils::NodeRc;
use std::collections::BTreeMap;

#[derive(Clone)]
pub struct Api(NodeRc);

impl Api {
  pub fn paths(&self) -> Option<BTreeMap<Vec<String>, NodeOrReference<Path>>> {
    let member = "paths";
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

impl From<NodeRc> for Api {
  fn from(value: NodeRc) -> Self {
    Self(value)
  }
}
