use crate::utils::NodeRc;

pub struct Api(NodeRc);

impl From<NodeRc> for Api {
  fn from(value: NodeRc) -> Self {
    Self(value)
  }
}

pub struct Path(NodeRc);

impl From<NodeRc> for Path {
  fn from(value: NodeRc) -> Self {
    Self(value)
  }
}

pub struct Operation(NodeRc);

impl Operation {
  pub fn name_get(&self) -> Option<&str> {
    self.0.as_object()?.get("name")?.as_str()
  }

  pub fn summary_get(&self) -> Option<&str> {
    self.0.as_object()?.get("summary")?.as_str()
  }

  pub fn description_get(&self) -> Option<&str> {
    self.0.as_object()?.get("description")?.as_str()
  }

  pub fn deprecated_get(&self) -> Option<bool> {
    self.0.as_object()?.get("deprecated")?.as_bool()
  }
}

impl From<NodeRc> for Operation {
  fn from(value: NodeRc) -> Self {
    Self(value)
  }
}

pub struct OperationResult(NodeRc);

impl OperationResult {
  pub fn description_get(&self) -> Option<&str> {
    self.0.as_object()?.get("description")?.as_str()
  }
}

impl From<NodeRc> for OperationResult {
  fn from(value: NodeRc) -> Self {
    Self(value)
  }
}

pub struct Body(NodeRc);

impl Body {
  //
}

impl From<NodeRc> for Body {
  fn from(value: NodeRc) -> Self {
    Self(value)
  }
}

pub struct Parameter(NodeRc);

impl Parameter {
  pub fn name_get(&self) -> Option<&str> {
    self.0.as_object()?.get("name")?.as_str()
  }

  pub fn required_get(&self) -> Option<bool> {
    self.0.as_object()?.get("required")?.as_bool()
  }
}

impl From<NodeRc> for Parameter {
  fn from(value: NodeRc) -> Self {
    Self(value)
  }
}
