use super::nodes;
use crate::{
  documents::{DocumentContext, DocumentTrait, Error},
  models,
  utils::NodeLocation,
};
use itertools::Itertools;
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

  fn make_api_model(&self, location: NodeLocation) -> Result<models::ApiContainer, Error> {
    let context = self.context.upgrade().unwrap();
    let node = context.get_node(&location).ok_or(Error::NodeNotFound)?;
    let api_node: nodes::Api = node.clone().into();

    let paths = api_node
      .path_pointers()
      .map(|iter| {
        iter
          .sorted()
          .map(|key| location.push_pointer(key.into_iter().map(Into::into).collect()))
          .enumerate()
          .map(|(index, location)| {
            self.make_path_model(self.dereference_location(location)?, index)
          })
          .collect::<Result<_, Error>>()
      })
      .unwrap_or_else(|| Ok(Default::default()))?;

    Ok(models::Api { location, paths }.into())
  }

  fn make_path_model(
    &self,
    location: NodeLocation,
    index: usize,
  ) -> Result<models::PathContainer, Error> {
    let context = self.context.upgrade().unwrap();
    let node = context.get_node(&location).ok_or(Error::NodeNotFound)?;

    let path_node: nodes::Path = node.clone().into();
    let pattern = location.get_pointer().unwrap().into_iter().last().unwrap();

    let operations = path_node
      .operation_pointers()
      .map(|iter| {
        iter
          .map(|key| location.push_pointer(key.into_iter().map(Into::into).collect()))
          .map(|location| self.make_operation_model(location))
          .collect::<Result<_, Error>>()
      })
      .unwrap_or_else(|| Ok(Default::default()))?;

    Ok(
      models::Path {
        index,
        location,
        pattern,
        operations,
      }
      .into(),
    )
  }

  fn make_operation_model(
    &self,
    location: NodeLocation,
  ) -> Result<models::OperationContainer, Error> {
    let context = self.context.upgrade().unwrap();
    let node = context.get_node(&location).ok_or(Error::NodeNotFound)?;
    let operation_node: nodes::Operation = node.clone().into();

    let method = location
      .get_pointer()
      .unwrap()
      .into_iter()
      .last()
      .unwrap()
      .as_str()
      .try_into()?;

    let cookie_parameters = operation_node
      .cookie_parameter_pointers()
      .map(|iter| {
        iter
          .map(|key| location.push_pointer(key.into_iter().map(Into::into).collect()))
          .map(|location| self.make_parameter_model(self.dereference_location(location)?))
          .collect::<Result<_, Error>>()
      })
      .unwrap_or_else(|| Ok(Default::default()))?;

    let header_parameters = operation_node
      .header_parameter_pointers()
      .map(|iter| {
        iter
          .map(|key| location.push_pointer(key.into_iter().map(Into::into).collect()))
          .map(|location| self.make_parameter_model(self.dereference_location(location)?))
          .collect::<Result<_, Error>>()
      })
      .unwrap_or_else(|| Ok(Default::default()))?;

    let path_parameters = operation_node
      .path_parameter_pointers()
      .map(|iter| {
        iter
          .map(|key| location.push_pointer(key.into_iter().map(Into::into).collect()))
          .map(|location| self.make_parameter_model(self.dereference_location(location)?))
          .collect::<Result<_, Error>>()
      })
      .unwrap_or_else(|| Ok(Default::default()))?;

    let query_parameters = operation_node
      .query_parameter_pointers()
      .map(|iter| {
        iter
          .map(|key| location.push_pointer(key.into_iter().map(Into::into).collect()))
          .map(|location| self.make_parameter_model(self.dereference_location(location)?))
          .collect::<Result<_, Error>>()
      })
      .unwrap_or_else(|| Ok(Default::default()))?;

    let bodies = operation_node
      .body_pointers()
      .map(|iter| {
        iter
          .map(|key| location.push_pointer(key.into_iter().map(Into::into).collect()))
          .map(|location| self.make_body_model(self.dereference_location(location)?))
          .collect::<Result<_, Error>>()
      })
      .unwrap_or_else(|| Ok(Default::default()))?;

    let operation_results = operation_node
      .operation_result_pointers()
      .map(|iter| {
        iter
          .map(|key| location.push_pointer(key.into_iter().map(Into::into).collect()))
          .map(|location| self.make_operation_result_model(self.dereference_location(location)?))
          .collect::<Result<_, Error>>()
      })
      .unwrap_or_else(|| Ok(Default::default()))?;

    Ok(
      models::Operation {
        location,
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
    location: NodeLocation,
  ) -> Result<models::OperationResultContainer, Error> {
    let context = self.context.upgrade().unwrap();
    let node = context.get_node(&location).ok_or(Error::NodeNotFound)?;
    let operation_result_node: nodes::OperationResult = node.clone().into();

    let status_kind = location.get_pointer().unwrap().into_iter().last().unwrap();

    let header_parameters = operation_result_node
      .header_parameter_pointers()
      .map(|iter| {
        iter
          .map(|key| location.push_pointer(key.into_iter().map(Into::into).collect()))
          .map(|location| self.make_parameter_model(self.dereference_location(location)?))
          .collect::<Result<_, Error>>()
      })
      .unwrap_or_else(|| Ok(Default::default()))?;

    let bodies = operation_result_node
      .body_pointers()
      .map(|iter| {
        iter
          .map(|key| location.push_pointer(key.into_iter().map(Into::into).collect()))
          .map(|location| self.make_body_model(location))
          .collect::<Result<_, Error>>()
      })
      .unwrap_or_else(|| Ok(Default::default()))?;
    Ok(
      models::OperationResult {
        location,
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

  fn make_body_model(&self, location: NodeLocation) -> Result<models::BodyContainer, Error> {
    let context = self.context.upgrade().unwrap();
    let node = context.get_node(&location).ok_or(Error::NodeNotFound)?;
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
    location: NodeLocation,
  ) -> Result<models::ParameterContainer, Error> {
    let context = self.context.upgrade().unwrap();
    let node = context.get_node(&location).ok_or(Error::NodeNotFound)?;
    let parameter_node: nodes::Parameter = node.clone().into();

    let schema_id = parameter_node
      .schema_pointer()
      .map(|key| location.push_pointer(key.into_iter().map(Into::into).collect()));

    Ok(
      models::Parameter {
        location,
        name: parameter_node.name().map(Into::into).unwrap(),
        required: parameter_node.required().unwrap_or(false),
        mockable: false,
        schema_id,
      }
      .into(),
    )
  }

  fn dereference_location(&self, location: NodeLocation) -> Result<NodeLocation, Error> {
    let context = self.context.upgrade().unwrap();
    let node = context.get_node(&location).ok_or(Error::NodeNotFound)?;
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

  fn get_api_model(&self) -> Result<models::ApiContainer, Error> {
    self.make_api_model(self.retrieval_location.clone())
  }
}
