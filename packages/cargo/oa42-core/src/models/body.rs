use crate::utils::NodeLocation;
use std::rc;
use wasm_bindgen::prelude::*;

pub struct Body {
  pub location: NodeLocation,
  pub content_type: String,
  pub schema_id: Option<NodeLocation>,
  pub mockable: bool,
}

#[derive(Clone)]
#[wasm_bindgen]
pub struct BodyContainer(rc::Rc<Body>);

#[wasm_bindgen]
impl BodyContainer {
  #[wasm_bindgen(getter, js_name = "location")]
  pub fn location(&self) -> String {
    self.0.location.to_string()
  }

  #[wasm_bindgen(getter, js_name = "contentType")]
  pub fn content_type(&self) -> String {
    self.0.content_type.clone()
  }

  #[wasm_bindgen(getter, js_name = "schemaId")]
  pub fn schema_id(&self) -> Option<String> {
    Some(self.0.schema_id.as_ref()?.to_string())
  }

  #[wasm_bindgen(getter, js_name = "mockable")]
  pub fn mockable(&self) -> bool {
    self.0.mockable
  }
}

impl From<rc::Rc<Body>> for BodyContainer {
  fn from(interior: rc::Rc<Body>) -> Self {
    Self(interior)
  }
}
