use super::*;
use std::collections::{BTreeMap, BTreeSet};

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

  pub fn security(&self) -> Option<Vec<BTreeMap<String, Vec<String>>>> {
    let member = "security";
    Some(
      self
        .0
        .as_object()?
        .get(member)?
        .as_array()?
        .iter()
        .filter_map(|value| {
          Some(
            value
              .as_object()?
              .iter()
              .filter_map(|(key, value)| {
                Some((
                  key.to_owned(),
                  value
                    .as_array()?
                    .iter()
                    .filter_map(|value| Some(value.as_str()?.to_owned()))
                    .collect(),
                ))
              })
              .collect(),
          )
        })
        .collect(),
    )
  }

  pub fn schema_component_pointers(&self) -> Option<BTreeSet<Vec<String>>> {
    Some(
      self
        .0
        .as_object()?
        .get("components")?
        .as_object()?
        .get("schemas")?
        .as_object()?
        .keys()
        .map(|key| {
          vec![
            "components".to_owned(),
            "schemas".to_owned(),
            key.to_owned(),
          ]
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
