use super::nodes;
use crate::{
  documents::{DocumentContext, DocumentError, DocumentTrait},
  models,
  utils::NodeLocation,
};
use itertools::Itertools;
use std::{iter, rc::Weak};

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

  fn make_api_model(
    &self,
    api_location: NodeLocation,
  ) -> Result<models::ApiContainer, DocumentError> {
    let context = self.context.upgrade().unwrap();
    let api_node = context
      .get_node(&api_location)
      .ok_or(DocumentError::NodeNotFound)?;
    let api_node: nodes::Api = api_node.clone().into();

    let paths = api_node
      .path_pointers()
      .into_iter()
      .flatten()
      .sorted()
      .map(|key| api_location.push_pointer(key.into_iter().map(Into::into).collect()))
      .enumerate()
      .map(|(index, location)| self.make_path_model(self.dereference_location(location)?, index))
      .collect::<Result<_, DocumentError>>()?;

    Ok(
      models::Api {
        location: api_location,
        paths,
      }
      .into(),
    )
  }

  fn make_path_model(
    &self,
    path_location: NodeLocation,
    index: usize,
  ) -> Result<models::PathContainer, DocumentError> {
    let context = self.context.upgrade().unwrap();
    let node = context
      .get_node(&path_location)
      .ok_or(DocumentError::NodeNotFound)?;

    let path_node: nodes::Path = node.clone().into();
    let pattern = path_location
      .get_pointer()
      .unwrap()
      .into_iter()
      .last()
      .unwrap();

    let operations = path_node
      .operation_pointers()
      .into_iter()
      .flatten()
      .map(|key| path_location.push_pointer(key.into_iter().map(Into::into).collect()))
      .map(|operation_location| {
        self.make_operation_model(path_location.clone(), operation_location)
      })
      .collect::<Result<_, DocumentError>>()?;

    Ok(
      models::Path {
        index,
        location: path_location,
        pattern,
        operations,
      }
      .into(),
    )
  }

  fn make_operation_model(
    &self,
    path_location: NodeLocation,
    operation_location: NodeLocation,
  ) -> Result<models::OperationContainer, DocumentError> {
    let context = self.context.upgrade().unwrap();
    let path_node = context
      .get_node(&path_location)
      .ok_or(DocumentError::NodeNotFound)?;
    let path_node: nodes::Path = path_node.clone().into();
    let operation_node = context
      .get_node(&operation_location)
      .ok_or(DocumentError::NodeNotFound)?;
    let operation_node: nodes::Operation = operation_node.clone().into();

    let method = operation_location
      .get_pointer()
      .unwrap()
      .into_iter()
      .last()
      .unwrap()
      .as_str()
      .try_into()?;

    let cookie_parameters = iter::empty()
      .chain(path_node.cookie_parameter_pointers().into_iter().flatten())
      .chain(
        operation_node
          .cookie_parameter_pointers()
          .into_iter()
          .flatten(),
      )
      .map(|key| operation_location.push_pointer(key.into_iter().map(Into::into).collect()))
      .map(|location| self.make_parameter_model(self.dereference_location(location)?))
      .collect::<Result<_, DocumentError>>()?;

    let header_parameters = iter::empty()
      .chain(path_node.header_parameter_pointers().into_iter().flatten())
      .chain(
        operation_node
          .header_parameter_pointers()
          .into_iter()
          .flatten(),
      )
      .map(|key| operation_location.push_pointer(key.into_iter().map(Into::into).collect()))
      .map(|location| self.make_parameter_model(self.dereference_location(location)?))
      .collect::<Result<_, DocumentError>>()?;

    let path_parameters = iter::empty()
      .chain(path_node.path_parameter_pointers().into_iter().flatten())
      .chain(
        operation_node
          .path_parameter_pointers()
          .into_iter()
          .flatten(),
      )
      .map(|key| operation_location.push_pointer(key.into_iter().map(Into::into).collect()))
      .map(|location| self.make_parameter_model(self.dereference_location(location)?))
      .collect::<Result<_, DocumentError>>()?;

    let query_parameters = iter::empty()
      .chain(path_node.query_parameter_pointers().into_iter().flatten())
      .chain(
        operation_node
          .query_parameter_pointers()
          .into_iter()
          .flatten(),
      )
      .map(|key| operation_location.push_pointer(key.into_iter().map(Into::into).collect()))
      .map(|location| self.make_parameter_model(self.dereference_location(location)?))
      .collect::<Result<_, DocumentError>>()?;

    let bodies = operation_node
      .body_pointers()
      .into_iter()
      .flatten()
      .map(|key| operation_location.push_pointer(key.into_iter().map(Into::into).collect()))
      .map(|location| self.make_body_model(self.dereference_location(location)?))
      .collect::<Result<_, DocumentError>>()?;

    let operation_results = operation_node
      .operation_result_pointers()
      .into_iter()
      .flatten()
      .map(|key| operation_location.push_pointer(key.into_iter().map(Into::into).collect()))
      .map(|location| self.make_operation_result_model(self.dereference_location(location)?))
      .collect::<Result<_, DocumentError>>()?;

    Ok(
      models::Operation {
        location: operation_location,
        name: operation_node.name().map(Into::into).unwrap(),
        summary: operation_node.summary().map(Into::into),
        description: operation_node.description().map(Into::into),
        deprecated: operation_node.deprecated().unwrap_or(false),
        method,
        mockable: false,
        cookie_parameters,
        header_parameters,
        path_parameters,
        query_parameters,
        bodies: bodies,
        operation_results,
      }
      .into(),
    )
  }

  fn make_operation_result_model(
    &self,
    operation_result_location: NodeLocation,
  ) -> Result<models::OperationResultContainer, DocumentError> {
    let context = self.context.upgrade().unwrap();
    let operation_result_node = context
      .get_node(&operation_result_location)
      .ok_or(DocumentError::NodeNotFound)?;
    let operation_result_node: nodes::OperationResult = operation_result_node.clone().into();

    let status_kind = operation_result_location
      .get_pointer()
      .unwrap()
      .into_iter()
      .last()
      .unwrap();

    let header_parameters = operation_result_node
      .header_parameter_pointers()
      .into_iter()
      .flatten()
      .map(|key| operation_result_location.push_pointer(key.into_iter().map(Into::into).collect()))
      .map(|location| self.make_parameter_model(self.dereference_location(location)?))
      .collect::<Result<_, DocumentError>>()?;

    let bodies = operation_result_node
      .body_pointers()
      .into_iter()
      .flatten()
      .map(|key| operation_result_location.push_pointer(key.into_iter().map(Into::into).collect()))
      .map(|location| self.make_body_model(location))
      .collect::<Result<_, DocumentError>>()?;

    Ok(
      models::OperationResult {
        location: operation_result_location,
        description: operation_result_node.description().map(Into::into),
        status_kind,
        status_codes: Vec::new(),
        mockable: false,
        header_parameters,
        bodies,
      }
      .into(),
    )
  }

  fn make_body_model(
    &self,
    location: NodeLocation,
  ) -> Result<models::BodyContainer, DocumentError> {
    let context = self.context.upgrade().unwrap();
    let node = context
      .get_node(&location)
      .ok_or(DocumentError::NodeNotFound)?;
    let body_node: nodes::Body = node.clone().into();

    let content_type = location.get_pointer().unwrap().into_iter().last().unwrap();

    let schema_id = body_node
      .schema_pointer()
      .map(|key| location.push_pointer(key.into_iter().map(Into::into).collect()));

    Ok(
      models::Body {
        location,
        content_type,
        mockable: false,
        schema_id,
      }
      .into(),
    )
  }

  fn make_parameter_model(
    &self,
    parameter_location: NodeLocation,
  ) -> Result<models::ParameterContainer, DocumentError> {
    let context = self.context.upgrade().unwrap();
    let parameter_node = context
      .get_node(&parameter_location)
      .ok_or(DocumentError::NodeNotFound)?;
    let parameter_node: nodes::Parameter = parameter_node.clone().into();

    let schema_id = parameter_node
      .schema_pointer()
      .map(|key| parameter_location.push_pointer(key.into_iter().map(Into::into).collect()));

    Ok(
      models::Parameter {
        location: parameter_location,
        name: parameter_node.name().map(Into::into).unwrap(),
        required: parameter_node.required().unwrap_or(false),
        mockable: false,
        schema_id,
      }
      .into(),
    )
  }

  fn dereference_location(&self, location: NodeLocation) -> Result<NodeLocation, DocumentError> {
    let context = self.context.upgrade().unwrap();
    let node = context
      .get_node(&location)
      .ok_or(DocumentError::NodeNotFound)?;
    let reference_node: nodes::Reference = node.clone().into();

    if let Some(reference) = reference_node.reference() {
      let reference_location = reference.parse()?;
      let location = location.join(&reference_location);
      Ok(location)
    } else {
      Ok(location)
    }
  }
}

impl DocumentTrait for Document {
  fn get_consequent_locations(&self) -> Box<dyn Iterator<Item = NodeLocation>> {
    Box::new(Vec::new().into_iter())
  }

  fn get_api_model(&self) -> Result<models::ApiContainer, DocumentError> {
    self.make_api_model(self.retrieval_location.clone())
  }
}
