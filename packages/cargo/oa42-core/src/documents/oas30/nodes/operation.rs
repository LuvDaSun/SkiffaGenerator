use super::*;
use crate::{
  documents::{collect_schema_locations, GetSchemaLocations},
  utils::{NodeLocation, NodeRc},
};
use std::{collections::BTreeMap, iter};

#[derive(Clone)]
pub struct Operation(NodeRc);

impl Operation {
  pub fn name(&self) -> Option<&str> {
    self.0.as_object()?.get("operationId")?.as_str()
  }

  pub fn summary(&self) -> Option<&str> {
    self.0.as_object()?.get("summary")?.as_str()
  }

  pub fn description(&self) -> Option<&str> {
    self.0.as_object()?.get("description")?.as_str()
  }

  pub fn deprecated(&self) -> Option<bool> {
    self.0.as_object()?.get("deprecated")?.as_bool()
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
        .into_iter()
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

  pub fn bodies(&self) -> Option<BTreeMap<Vec<String>, Body>> {
    let member = "requestBody";
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

  pub fn operation_results(
    &self,
  ) -> Option<BTreeMap<Vec<String>, NodeOrReference<OperationResult>>> {
    let member = "responses";
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

impl From<NodeRc> for Operation {
  fn from(value: NodeRc) -> Self {
    Self(value)
  }
}

impl GetSchemaLocations for Operation {
  fn get_schema_locations(&self, location: &NodeLocation) -> Vec<NodeLocation> {
    iter::empty()
      .chain(collect_schema_locations(
        self.request_parameters(),
        location,
      ))
      .chain(collect_schema_locations(self.bodies(), location))
      .collect()
  }
}
