use super::*;
use std::collections::BTreeMap;

#[derive(Clone)]
pub struct Api(serde_json::Value);

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

  pub fn security_schemes(&self) -> Option<BTreeMap<Vec<String>, NodeOrReference<SecurityScheme>>> {
    let member = "components";
    let member_1 = "securitySchemes";
    Some(
      self
        .0
        .as_object()?
        .get(member)?
        .as_object()?
        .get(member_1)?
        .as_object()?
        .into_iter()
        .map(|(key, node)| {
          (
            vec![member.to_owned(), member_1.to_owned(), key.clone()],
            node.clone().into(),
          )
        })
        .collect(),
    )
  }
}

impl From<serde_json::Value> for Api {
  fn from(value: serde_json::Value) -> Self {
    Self(value)
  }
}
