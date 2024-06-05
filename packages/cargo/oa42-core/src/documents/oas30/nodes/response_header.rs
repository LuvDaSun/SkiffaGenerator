

#[derive(Clone)]
pub struct ResponseHeader(serde_json::Value);

impl ResponseHeader {
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

impl From<serde_json::Value> for ResponseHeader {
  fn from(value: serde_json::Value) -> Self {
    Self(value)
  }
}
