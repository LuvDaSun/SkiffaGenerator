#[derive(Clone)]
pub struct SecurityScheme(serde_json::Value);

impl SecurityScheme {
  pub fn r#type(&self) -> Option<&str> {
    self.0.as_object()?.get("type")?.as_str()
  }

  pub fn description(&self) -> Option<&str> {
    self.0.as_object()?.get("description")?.as_str()
  }

  pub fn parameter_name(&self) -> Option<&str> {
    self.0.as_object()?.get("name")?.as_str()
  }

  pub fn r#in(&self) -> Option<&str> {
    self.0.as_object()?.get("in")?.as_str()
  }

  pub fn scheme(&self) -> Option<&str> {
    self.0.as_object()?.get("scheme")?.as_str()
  }
}

impl From<serde_json::Value> for SecurityScheme {
  fn from(value: serde_json::Value) -> Self {
    Self(value)
  }
}
