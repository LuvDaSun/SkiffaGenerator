use super::nodes;
use crate::{
  documents::{DocumentContext, DocumentTrait},
  models,
  utils::NodeLocation,
};
use std::rc::Weak;

pub struct Document {
  context: Weak<DocumentContext>,
  retrieval_location: NodeLocation,
}

impl Document {
  pub fn new(context: Weak<DocumentContext>, retrieval_location: NodeLocation) -> Self {
    Self {
      context,
      retrieval_location,
    }
  }

  fn make_api_model(&self, location: NodeLocation) -> models::Api {
    let context = self.context.upgrade().unwrap();
    let node = context.get_node(&location).unwrap();
    let node: nodes::Api = node.into();

    models::Api {
      location,
      paths: Vec::new(),
    }
  }

  fn make_path_model(&self, location: NodeLocation, index: usize) -> models::Path {
    let context = self.context.upgrade().unwrap();
    let node = context.get_node(&location).unwrap();
    let node: nodes::Path = node.into();

    let pattern = location.get_pointer().unwrap().into_iter().last().unwrap();

    models::Path {
      index,
      location,
      pattern,
      operations: Vec::new(),
    }
  }

  fn make_operation_model(&self, location: NodeLocation) -> models::Operation {
    let context = self.context.upgrade().unwrap();
    let node = context.get_node(&location).unwrap();
    let node: nodes::Operation = node.into();

    let method = location
      .get_pointer()
      .unwrap()
      .into_iter()
      .last()
      .unwrap()
      .as_str()
      .into();

    models::Operation {
      location,
      name: node.name_get().map(Into::into).unwrap(),
      summary: node.summary_get().map(Into::into),
      description: node.description_get().map(Into::into),
      deprecated: node.deprecated_get().unwrap_or(false),
      method,
      mockable: false,
      cookie_parameters: Vec::new(),
      header_parameters: Vec::new(),
      path_parameters: Vec::new(),
      query_parameters: Vec::new(),
      bodies: Vec::new(),
      operation_results: Vec::new(),
    }
  }

  fn make_operation_result_model(&self, location: NodeLocation) -> models::OperationResult {
    let context = self.context.upgrade().unwrap();
    let node = context.get_node(&location).unwrap();
    let node: nodes::OperationResult = node.into();

    let status_kind = location.get_pointer().unwrap().into_iter().last().unwrap();

    models::OperationResult {
      location,
      description: node.description_get().map(Into::into),
      status_kind,
      status_codes: Vec::new(),
      mockable: false,
      header_parameters: Vec::new(),
      bodies: Vec::new(),
    }
  }

  fn make_body_model(&self, location: NodeLocation) -> models::Body {
    let context = self.context.upgrade().unwrap();
    let node = context.get_node(&location).unwrap();
    let node: nodes::Body = node.into();

    let content_type = location.get_pointer().unwrap().into_iter().last().unwrap();

    models::Body {
      location,
      content_type,
      mockable: false,
      schema_id: None,
    }
  }

  fn make_parameter_model(&self, location: NodeLocation) -> models::Parameter {
    let context = self.context.upgrade().unwrap();
    let node = context.get_node(&location).unwrap();
    let node: nodes::Parameter = node.into();

    models::Parameter {
      location,
      name: node.name_get().map(Into::into).unwrap(),
      required: node.required_get().unwrap_or(false),
      mockable: false,
      schema_id: None,
    }
  }
}

impl DocumentTrait for Document {
  fn get_consequent_locations(&self) -> Box<dyn Iterator<Item = NodeLocation>> {
    Box::new(Vec::new().into_iter())
  }
}
