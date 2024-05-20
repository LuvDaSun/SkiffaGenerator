use crate::utils::NodeLocation;

pub trait DocumentTrait {
  fn get_consequent_locations(&self) -> Box<dyn Iterator<Item = NodeLocation>>;
}

pub struct DocumentConfiguration {
  pub retrieval_location: NodeLocation,
}

pub type DocumentFactory = Box<dyn Fn(DocumentConfiguration) -> Box<dyn DocumentTrait>>;
