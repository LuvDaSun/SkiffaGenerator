use super::*;
use crate::{
  documents::{collect_schema_locations, oas30::ToNode, GetSchemaLocations},
  utils::{NodeLocation, NodeRc},
};
use std::{collections::BTreeMap, iter};

#[derive(Clone)]
pub struct OperationResult(NodeRc);

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

impl From<NodeRc> for OperationResult {
  fn from(value: NodeRc) -> Self {
    Self(value)
  }
}

impl GetSchemaLocations for OperationResult {
  fn get_schema_locations(&self, location: &NodeLocation) -> Vec<NodeLocation> {
    iter::empty()
      .chain(collect_schema_locations(self.response_headers(), location))
      .chain(collect_schema_locations(self.bodies(), location))
      .collect()
  }
}

impl ToNode<OperationResult> for OperationResult {
  fn to_node(self) -> Option<OperationResult> {
    Some(self)
  }
}
