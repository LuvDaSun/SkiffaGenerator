use super::nodes::{self, NodeOrReference};
use crate::{
  documents::{DocumentContext, DocumentError, DocumentInterface},
  models,
  utils::{NodeLocation, NodeRc},
};
use std::{iter, rc};

pub struct Document {
  context: rc::Weak<DocumentContext>,
  retrieval_location: NodeLocation,
}

impl Document {
  pub fn new(context: rc::Weak<DocumentContext>, retrieval_location: NodeLocation) -> Self {
    Self {
      context,
      retrieval_location,
    }
  }

  fn make_api_model(
    &self,
    api_location: NodeLocation,
    api_node: nodes::Api,
  ) -> Result<models::ApiContainer, DocumentError> {
    let paths = api_node
      .paths()
      .into_iter()
      .flatten()
      .enumerate()
      .map(|(index, (pointer, node))| {
        let pattern = pointer.last().unwrap().clone();
        let id = index + 1;
        let location = api_location.push_pointer(pointer);
        let (location, node) = self.dereference(location, node)?;
        self.make_path_model(location, node, id, pattern)
      })
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
    path_node: nodes::Path,
    id: usize,
    pattern: String,
  ) -> Result<models::PathContainer, DocumentError> {
    let operations = path_node
      .operations()
      .into_iter()
      .flatten()
      .map(|(pointer, node)| {
        let method = pointer.last().unwrap().as_str().try_into()?;
        let location = path_location.push_pointer(pointer);
        self.make_operation_model(
          path_location.clone(),
          path_node.clone(),
          location,
          node,
          method,
        )
      })
      .collect::<Result<_, DocumentError>>()?;

    Ok(
      models::Path {
        id,
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
    path_node: nodes::Path,
    operation_location: NodeLocation,
    operation_node: nodes::Operation,
    method: models::Method,
  ) -> Result<models::OperationContainer, DocumentError> {
    let all_parameter_nodes = iter::empty()
      .chain(
        path_node
          .parameters()
          .into_iter()
          .flatten()
          .map(|(pointer, node)| {
            let location = path_location.push_pointer(pointer);
            self.dereference(location, node)
          }),
      )
      .chain(
        operation_node
          .parameters()
          .into_iter()
          .flatten()
          .map(|(pointer, node)| {
            let location = operation_location.push_pointer(pointer);
            self.dereference(location, node)
          }),
      )
      .collect::<Result<Vec<_>, DocumentError>>()?;

    let cookie_parameters = all_parameter_nodes
      .iter()
      .filter_map(|(location, node)| {
        if node.r#in()? == "cookie" {
          Some(self.make_parameter_model_request(location.clone(), node.clone()))
        } else {
          None
        }
      })
      .collect::<Result<Vec<_>, DocumentError>>()?;

    let header_parameters = all_parameter_nodes
      .iter()
      .filter_map(|(location, node)| {
        if node.r#in()? == "header" {
          Some(self.make_parameter_model_request(location.clone(), node.clone()))
        } else {
          None
        }
      })
      .collect::<Result<Vec<_>, DocumentError>>()?;

    let path_parameters = all_parameter_nodes
      .iter()
      .filter_map(|(location, node)| {
        if node.r#in()? == "path" {
          Some(self.make_parameter_model_request(location.clone(), node.clone()))
        } else {
          None
        }
      })
      .collect::<Result<Vec<_>, DocumentError>>()?;

    let query_parameters = all_parameter_nodes
      .iter()
      .filter_map(|(location, node)| {
        if node.r#in()? == "query" {
          Some(self.make_parameter_model_request(location.clone(), node.clone()))
        } else {
          None
        }
      })
      .collect::<Result<Vec<_>, DocumentError>>()?;

    let bodies = operation_node
      .body_pointers()
      .into_iter()
      .flatten()
      .map(|pointer| operation_location.push_pointer(pointer))
      .map(|location| self.make_body_model(self.dereference_location(location)?))
      .collect::<Result<_, DocumentError>>()?;

    let operation_results = operation_node
      .operation_result_pointers()
      .into_iter()
      .flatten()
      .map(|pointer| operation_location.push_pointer(pointer))
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
      .map(|pointer| operation_result_location.push_pointer(pointer))
      .map(|location| self.make_response_parameter_model(self.dereference_location(location)?))
      .collect::<Result<_, DocumentError>>()?;

    let bodies = operation_result_node
      .body_pointers()
      .into_iter()
      .flatten()
      .map(|pointer| operation_result_location.push_pointer(pointer))
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
      .map(|pointer| location.push_pointer(pointer));

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

  fn make_parameter_model_request(
    &self,
    parameter_location: NodeLocation,
    parameter_node: nodes::RequestParameter,
  ) -> Result<models::ParameterContainer, DocumentError> {
    let schema_id = parameter_node
      .schema_pointer()
      .map(|pointer| parameter_location.push_pointer(pointer));

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

  fn make_response_parameter_model(
    &self,
    parameter_location: NodeLocation,
  ) -> Result<models::ParameterContainer, DocumentError> {
    let context = self.context.upgrade().unwrap();
    let parameter_node = context
      .get_node(&parameter_location)
      .ok_or(DocumentError::NodeNotFound)?;
    let parameter_node: nodes::ResponseParameter = parameter_node.clone().into();

    let schema_id = parameter_node
      .schema_pointer()
      .map(|pointer| parameter_location.push_pointer(pointer));

    let name = parameter_location
      .get_pointer()
      .unwrap()
      .into_iter()
      .last()
      .unwrap();

    Ok(
      models::Parameter {
        location: parameter_location,
        name,
        required: parameter_node.required().unwrap_or(false),
        mockable: false,
        schema_id,
      }
      .into(),
    )
  }

  fn dereference<T>(
    &self,
    location: NodeLocation,
    node: NodeOrReference<T>,
  ) -> Result<(NodeLocation, T), DocumentError>
  where
    T: From<NodeRc>,
  {
    match node {
      NodeOrReference::Reference(reference) => {
        let reference_location = NodeLocation::parse(&reference)?;
        let context = self.context.upgrade().unwrap();
        let location = location.join(&reference_location);
        let node = context
          .get_node(&location)
          .ok_or(DocumentError::NodeNotFound)?;
        let node = node.into();
        Ok((location, node))
      }
      NodeOrReference::Node(node) => Ok((location, node)),
    }
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

impl DocumentInterface for Document {
  fn get_consequent_locations(&self) -> Box<dyn Iterator<Item = NodeLocation>> {
    Box::new(Vec::new().into_iter())
  }

  fn as_api(&self) -> Result<models::ApiContainer, DocumentError> {
    let context = self.context.upgrade().unwrap();
    let api_node = context
      .get_node(&self.retrieval_location)
      .ok_or(DocumentError::NodeNotFound)?;
    let api_node: nodes::Api = api_node.clone().into();

    self.make_api_model(self.retrieval_location.clone(), api_node)
  }
}
