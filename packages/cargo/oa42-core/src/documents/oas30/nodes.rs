use crate::{models, utils::NodeRc};
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

#[derive(Clone)]
pub struct Path(NodeRc);

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

  pub fn parameters(&self) -> Option<BTreeMap<Vec<String>, NodeOrReference<RequestParameter>>> {
    let member = "parameters";
    Some(
      self
        .0
        .as_object()?
        .get(member)?
        .as_array()?
        .into_iter()
        .enumerate()
        .map(move |(key, node)| {
          (
            vec![member.to_owned(), key.to_string()],
            node.clone().into(),
          )
        })
        .collect(),
    )
  }
}

impl From<NodeRc> for Path {
  fn from(value: NodeRc) -> Self {
    Self(value)
  }
}

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

  pub fn parameters(&self) -> Option<BTreeMap<Vec<String>, NodeOrReference<RequestParameter>>> {
    let member = "parameters";
    Some(
      self
        .0
        .as_object()?
        .get(member)?
        .as_array()?
        .into_iter()
        .enumerate()
        .map(move |(key, node)| {
          (
            vec![member.to_owned(), key.to_string()],
            node.clone().into(),
          )
        })
        .collect(),
    )
  }

  pub fn body_pointers(&self) -> Option<impl Iterator<Item = Vec<String>> + '_> {
    let member = "requestBody";
    Some(
      self
        .0
        .as_object()?
        .get(member)?
        .as_object()?
        .keys()
        .map(move |key| vec![member.to_owned(), key.clone()]),
    )
  }

  pub fn operation_result_pointers(&self) -> Option<impl Iterator<Item = Vec<String>> + '_> {
    let member = "responses";
    Some(
      self
        .0
        .as_object()?
        .get(member)?
        .as_object()?
        .keys()
        .map(move |key| vec![member.to_owned(), key.clone()]),
    )
  }
}

impl From<NodeRc> for Operation {
  fn from(value: NodeRc) -> Self {
    Self(value)
  }
}

#[derive(Clone)]
pub struct OperationResult(NodeRc);

impl OperationResult {
  pub fn description(&self) -> Option<&str> {
    self.0.as_object()?.get("description")?.as_str()
  }

  pub fn parameters(&self) -> Option<BTreeMap<Vec<String>, NodeOrReference<RequestParameter>>> {
    let member = "parameters";
    Some(
      self
        .0
        .as_object()?
        .get(member)?
        .as_array()?
        .into_iter()
        .enumerate()
        .map(move |(key, node)| {
          (
            vec![member.to_owned(), key.to_string()],
            node.clone().into(),
          )
        })
        .collect(),
    )
  }

  pub fn body_pointers(&self) -> Option<impl Iterator<Item = Vec<String>> + '_> {
    let member = "content";
    Some(
      self
        .0
        .as_object()?
        .get(member)?
        .as_object()?
        .keys()
        .map(move |key| vec![member.to_owned(), key.clone()]),
    )
  }
}

impl From<NodeRc> for OperationResult {
  fn from(value: NodeRc) -> Self {
    Self(value)
  }
}

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

#[derive(Clone)]
pub struct ResponseParameter(NodeRc);

impl ResponseParameter {
  pub fn schema_pointer(&self) -> Option<Vec<String>> {
    self
      .0
      .as_object()?
      .get("schema")
      .map(|_value| vec!["schema".to_owned()])
  }

  pub fn required(&self) -> Option<bool> {
    self.0.as_object()?.get("required")?.as_bool()
  }
}

impl From<NodeRc> for ResponseParameter {
  fn from(value: NodeRc) -> Self {
    Self(value)
  }
}

#[derive(Clone)]
pub struct Reference(NodeRc);

impl Reference {
  pub fn reference(&self) -> Option<&str> {
    self.0.as_object()?.get("$ref")?.as_str()
  }
}

impl From<NodeRc> for Reference {
  fn from(value: NodeRc) -> Self {
    Self(value)
  }
}

#[derive(Clone)]
pub enum NodeOrReference<T>
where
  T: From<NodeRc>,
{
  Node(T),
  Reference(String),
}

impl<T> From<NodeRc> for NodeOrReference<T>
where
  T: From<NodeRc>,
{
  fn from(value: NodeRc) -> Self {
    let reference_node: Reference = value.clone().into();
    if let Some(reference) = reference_node.reference() {
      return NodeOrReference::Reference(reference.to_owned());
    }
    NodeOrReference::Node(value.into())
  }
}
