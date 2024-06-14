use crate::utils::NodeLocation;
use std::rc;
use wasm_bindgen::prelude::*;

pub struct Parameter {
  pub location: NodeLocation,
  pub name: String,
  pub required: bool,
  pub schema_id: Option<NodeLocation>,
  pub mockable: bool,
}

#[derive(Clone)]
#[wasm_bindgen]
pub struct ParameterContainer(rc::Rc<Parameter>);

#[wasm_bindgen]
impl ParameterContainer {
  #[wasm_bindgen(getter, js_name = "location")]
  pub fn location(&self) -> String {
    self.0.location.to_string()
  }

  #[wasm_bindgen(getter, js_name = "name")]
  pub fn name(&self) -> String {
    self.0.name.clone()
  }

  #[wasm_bindgen(getter, js_name = "required")]
  pub fn required(&self) -> bool {
    self.0.required
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

impl From<rc::Rc<Parameter>> for ParameterContainer {
  fn from(interior: rc::Rc<Parameter>) -> Self {
    Self(interior)
  }
}
