#[derive(Clone)]
pub struct Body(serde_json::Value);

impl Body {
  pub fn schema_pointer(&self) -> Option<Vec<String>> {
    self
      .0
      .as_object()?
      .get("schema")
      .map(|_value| vec!["schema".to_owned()])
  }
}

impl From<serde_json::Value> for Body {
  fn from(value: serde_json::Value) -> Self {
    Self(value)
  }
}
