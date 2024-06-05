#[derive(Clone)]
pub struct Reference(serde_json::Value);

impl Reference {
  pub fn reference(&self) -> Option<&str> {
    self.0.as_object()?.get("$ref")?.as_str()
  }
}

impl From<serde_json::Value> for Reference {
  fn from(value: serde_json::Value) -> Self {
    Self(value)
  }
}
