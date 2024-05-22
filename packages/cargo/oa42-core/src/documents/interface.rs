use super::DocumentError;
use crate::{models, utils::NodeLocation};

pub trait DocumentInterface {
  fn get_consequent_locations(&self) -> Box<dyn Iterator<Item = NodeLocation>>;
  fn as_api(&self) -> Result<models::ApiContainer, DocumentError>;
}

pub struct DocumentConfiguration {
  pub retrieval_location: NodeLocation,
}

pub type DocumentFactory = Box<dyn Fn(DocumentConfiguration) -> Box<dyn DocumentInterface>>;
