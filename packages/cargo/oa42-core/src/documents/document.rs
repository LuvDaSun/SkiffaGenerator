use super::Error;
use crate::{models, utils::NodeLocation};

pub trait DocumentTrait {
  fn get_consequent_locations(&self) -> Box<dyn Iterator<Item = NodeLocation>>;
  fn get_api_model(&self) -> Result<models::ApiContainer, Error>;
}

pub struct DocumentConfiguration {
  pub retrieval_location: NodeLocation,
}

pub type DocumentFactory = Box<dyn Fn(DocumentConfiguration) -> Box<dyn DocumentTrait>>;
