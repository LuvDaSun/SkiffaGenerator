use crate::utils::NodeRc;

pub struct ApiNode(NodeRc);

impl From<NodeRc> for ApiNode {
  fn from(value: NodeRc) -> Self {
    Self(value)
  }
}

pub struct PathNode(NodeRc);

impl From<NodeRc> for PathNode {
  fn from(value: NodeRc) -> Self {
    Self(value)
  }
}
