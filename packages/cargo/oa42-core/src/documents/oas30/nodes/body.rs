use super::*;
use crate::{
  documents::GetSchemaLocations,
  models,
  utils::{NodeLocation, NodeRc},
};
use std::{collections::BTreeMap, iter};

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

impl GetSchemaLocations for Body {
  fn get_schema_locations(&self, location: &NodeLocation) -> Vec<crate::utils::NodeLocation> {
    self
      .schema_pointer()
      .into_iter()
      .map(|pointer| location.push_pointer(pointer))
      .collect()
  }
}
