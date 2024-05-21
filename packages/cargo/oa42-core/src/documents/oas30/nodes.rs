use crate::{models, utils::NodeRc};

pub struct Api(NodeRc);

impl Api {
  pub fn path_pointers(&self) -> Option<impl Iterator<Item = Vec<String>> + '_> {
    let member = "paths";
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

impl From<NodeRc> for Api {
  fn from(value: NodeRc) -> Self {
    Self(value)
  }
}

pub struct Path(NodeRc);
impl Path {
  pub fn operation_pointers(&self) -> Option<impl Iterator<Item = Vec<String>> + '_> {
    Some(
      self
        .0
        .as_object()?
        .keys()
        .filter(|key| models::Method::try_from(key.as_str()).is_ok())
        .map(|key| vec![key.clone()]),
    )
  }

  pub fn cookie_parameter_pointers(&self) -> Option<impl Iterator<Item = Vec<String>> + '_> {
    let member = "parameters";
    Some(
      self
        .0
        .as_object()?
        .get(member)?
        .as_array()?
        .into_iter()
        .enumerate()
        .filter_map(|(key, value)| {
          if value.as_object()?.get("in")?.as_str()? == "cookie" {
            Some(key)
          } else {
            None
          }
        })
        .map(move |key| vec![member.to_owned(), key.to_string()]),
    )
  }

  pub fn header_parameter_pointers(&self) -> Option<impl Iterator<Item = Vec<String>> + '_> {
    let member = "parameters";
    Some(
      self
        .0
        .as_object()?
        .get(member)?
        .as_array()?
        .into_iter()
        .enumerate()
        .filter_map(|(key, value)| {
          if value.as_object()?.get("in")?.as_str()? == "header" {
            Some(key)
          } else {
            None
          }
        })
        .map(move |key| vec![member.to_owned(), key.to_string()]),
    )
  }

  pub fn path_parameter_pointers(&self) -> Option<impl Iterator<Item = Vec<String>> + '_> {
    let member = "parameters";
    Some(
      self
        .0
        .as_object()?
        .get(member)?
        .as_array()?
        .into_iter()
        .enumerate()
        .filter_map(|(key, value)| {
          if value.as_object()?.get("in")?.as_str()? == "path" {
            Some(key)
          } else {
            None
          }
        })
        .map(move |key| vec![member.to_owned(), key.to_string()]),
    )
  }

  pub fn query_parameter_pointers(&self) -> Option<impl Iterator<Item = Vec<String>> + '_> {
    let member = "parameters";
    Some(
      self
        .0
        .as_object()?
        .get(member)?
        .as_array()?
        .into_iter()
        .enumerate()
        .filter_map(|(key, value)| {
          if value.as_object()?.get("in")?.as_str()? == "query" {
            Some(key)
          } else {
            None
          }
        })
        .map(move |key| vec![member.to_owned(), key.to_string()]),
    )
  }
}

impl From<NodeRc> for Path {
  fn from(value: NodeRc) -> Self {
    Self(value)
  }
}

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

  pub fn cookie_parameter_pointers(&self) -> Option<impl Iterator<Item = Vec<String>> + '_> {
    let member = "parameters";
    Some(
      self
        .0
        .as_object()?
        .get(member)?
        .as_array()?
        .into_iter()
        .enumerate()
        .filter_map(|(key, value)| {
          if value.as_object()?.get("in")?.as_str()? == "cookie" {
            Some(key)
          } else {
            None
          }
        })
        .map(move |key| vec![member.to_owned(), key.to_string()]),
    )
  }

  pub fn header_parameter_pointers(&self) -> Option<impl Iterator<Item = Vec<String>> + '_> {
    let member = "parameters";
    Some(
      self
        .0
        .as_object()?
        .get(member)?
        .as_array()?
        .into_iter()
        .enumerate()
        .filter_map(|(key, value)| {
          if value.as_object()?.get("in")?.as_str()? == "header" {
            Some(key)
          } else {
            None
          }
        })
        .map(move |key| vec![member.to_owned(), key.to_string()]),
    )
  }

  pub fn path_parameter_pointers(&self) -> Option<impl Iterator<Item = Vec<String>> + '_> {
    let member = "parameters";
    Some(
      self
        .0
        .as_object()?
        .get(member)?
        .as_array()?
        .into_iter()
        .enumerate()
        .filter_map(|(key, value)| {
          if value.as_object()?.get("in")?.as_str()? == "path" {
            Some(key)
          } else {
            None
          }
        })
        .map(move |key| vec![member.to_owned(), key.to_string()]),
    )
  }

  pub fn query_parameter_pointers(&self) -> Option<impl Iterator<Item = Vec<String>> + '_> {
    let member = "parameters";
    Some(
      self
        .0
        .as_object()?
        .get(member)?
        .as_array()?
        .into_iter()
        .enumerate()
        .filter_map(|(key, value)| {
          if value.as_object()?.get("in")?.as_str()? == "query" {
            Some(key)
          } else {
            None
          }
        })
        .map(move |key| vec![member.to_owned(), key.to_string()]),
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

pub struct OperationResult(NodeRc);

impl OperationResult {
  pub fn description(&self) -> Option<&str> {
    self.0.as_object()?.get("description")?.as_str()
  }

  pub fn header_parameter_pointers(&self) -> Option<impl Iterator<Item = Vec<String>> + '_> {
    let member = "headers";
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

pub struct Parameter(NodeRc);

impl Parameter {
  pub fn schema_pointer(&self) -> Option<Vec<String>> {
    self
      .0
      .as_object()?
      .get("schema")
      .map(|_value| vec!["schema".to_owned()])
  }

  pub fn name(&self) -> Option<&str> {
    self.0.as_object()?.get("name")?.as_str()
  }

  pub fn required(&self) -> Option<bool> {
    self.0.as_object()?.get("required")?.as_bool()
  }
}

impl From<NodeRc> for Parameter {
  fn from(value: NodeRc) -> Self {
    Self(value)
  }
}

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
