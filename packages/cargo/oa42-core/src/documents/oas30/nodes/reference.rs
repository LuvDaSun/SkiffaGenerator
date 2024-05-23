use crate::utils::NodeRc;

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
