use super::*;
use crate::{
  documents::GetSchemaLocations,
  models,
  utils::{NodeLocation, NodeRc},
};
use std::collections::BTreeMap;

#[derive(Clone)]
pub struct RequestParameter(NodeRc);

impl RequestParameter {
  pub fn schema_pointer(&self) -> Option<Vec<String>> {
    self
      .0
      .as_object()?
      .get("schema")
      .map(|_value| vec!["schema".to_owned()])
  }

  pub fn r#in(&self) -> Option<&str> {
    self.0.as_object()?.get("in")?.as_str()
  }

  pub fn name(&self) -> Option<&str> {
    self.0.as_object()?.get("name")?.as_str()
  }

  pub fn required(&self) -> Option<bool> {
    self.0.as_object()?.get("required")?.as_bool()
  }
}

impl From<NodeRc> for RequestParameter {
  fn from(value: NodeRc) -> Self {
    Self(value)
  }
}

impl GetSchemaLocations for RequestParameter {
  fn get_schema_locations(&self, location: &NodeLocation) -> Vec<crate::utils::NodeLocation> {
    self
      .schema_pointer()
      .into_iter()
      .map(|pointer| location.push_pointer(pointer))
      .collect()
  }
}
