use super::*;
use crate::{
  documents::{collect_schema_locations, oas30::ToNode, GetSchemaLocations},
  utils::{NodeLocation, NodeRc},
};
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

impl GetSchemaLocations for Api {
  fn get_schema_locations(&self, location: &NodeLocation) -> Vec<NodeLocation> {
    collect_schema_locations(self.paths(), location)
  }
}

impl ToNode<Api> for Api {
  fn to_node(self) -> Option<Api> {
    Some(self)
  }
}
