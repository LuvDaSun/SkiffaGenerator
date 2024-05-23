use super::DocumentError;
use crate::{models, utils::NodeLocation};

pub trait DocumentInterface {
  fn get_consequent_locations(&self) -> Result<Vec<NodeLocation>, DocumentError>;
  fn get_api_model(&self) -> Result<models::ApiContainer, DocumentError>;
}

pub struct DocumentConfiguration {
  pub retrieval_location: NodeLocation,
}

pub type DocumentFactory = Box<dyn Fn(DocumentConfiguration) -> Box<dyn DocumentInterface>>;
