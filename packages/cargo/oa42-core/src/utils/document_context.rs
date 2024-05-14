use crate::error::Error;
use crate::utils::NodeRc;
use crate::utils::{node_location::NodeLocation, read_node};
use std::collections::BTreeMap;
use std::future::Future;
use std::hash::Hash;
use std::pin::Pin;
use std::{
  cell::RefCell,
  collections::HashMap,
  rc::{Rc, Weak},
};

pub struct EmbeddedDocument {
  pub retrieval_location: NodeLocation,
  pub given_location: NodeLocation,
}

pub struct ReferencedDocument {
  pub retrieval_location: NodeLocation,
  pub given_location: NodeLocation,
}

pub trait Document<E> {
  fn get_referenced_documents(&self) -> &Vec<ReferencedDocument>;
  fn get_embedded_documents(&self) -> &Vec<EmbeddedDocument>;

  fn get_document_location(&self) -> &NodeLocation;
  fn get_antecedent_location(&self) -> Option<&NodeLocation>;
  fn get_node_locations(&self) -> Vec<NodeLocation>;

  fn get_document_elements(&self) -> BTreeMap<NodeLocation, E>;

  fn resolve_anchor(&self, anchor: &str) -> Option<Vec<String>>;
  fn resolve_antecedent_anchor(&self, anchor: &str) -> Option<Vec<String>>;
}

pub struct DocumentConfiguration {
  pub retrieval_location: NodeLocation,
  pub given_location: NodeLocation,
  pub antecedent_location: Option<NodeLocation>,
  pub document_node: NodeRc,
}

pub type DocumentFactory<K, E> =
  dyn Fn(Weak<DocumentContext<K, E>>, DocumentConfiguration) -> Rc<dyn Document<E>>;
pub type DiscoverDocumentType<K> = Box<dyn Fn(&NodeRc) -> &K>;
pub type FetchFile = Box<dyn Fn(String) -> Pin<Box<dyn Future<Output = Result<String, Error>>>>>;

type Queue = Vec<(NodeLocation, NodeLocation, Option<NodeLocation>, String)>;

pub struct DocumentContext<K, E> {
  /**
  Maps node retrieval locations to their documents. Every node has a location that is an identifier. Thi
  map maps that identifier to the identifier of a document.
  */
  node_documents: RefCell<HashMap<NodeLocation, NodeLocation>>,

  /**
  Keeps all loaded nodes. Nodes are retrieved and then stored in this cache. Then we work
  exclusively from this cache. The key is the retrieval location of the node.
  */
  node_cache: RefCell<HashMap<NodeLocation, NodeRc>>,

  /**
   * all documents, indexed by the document node id of the document
   */
  documents: RefCell<HashMap<NodeLocation, Rc<dyn Document<E>>>>,

  /**
  This map maps document retrieval locations to document root locations
   */
  document_resolved: RefCell<HashMap<NodeLocation, NodeLocation>>,

  /**
   * document factories by document type key
   */
  factories: HashMap<K, Box<DocumentFactory<K, E>>>,

  fetch_file: FetchFile,

  discover_document_type: DiscoverDocumentType<K>,
}

impl<K, E> DocumentContext<K, E>
where
  K: PartialEq + Eq + Hash,
{
  pub fn new(fetch_file: FetchFile, discover_document_type: DiscoverDocumentType<K>) -> Rc<Self> {
    Rc::new(Self {
      node_documents: Default::default(),
      node_cache: Default::default(),
      documents: Default::default(),
      document_resolved: Default::default(),
      factories: Default::default(),
      fetch_file,
      discover_document_type,
    })
  }

  pub fn register_factory(
    self: &mut Rc<Self>,
    schema: K,
    factory: Box<DocumentFactory<K, E>>,
  ) -> Result<(), Error> {
    /*
    don't check if the factory is already registered here so we can
    override factories
    */
    Rc::get_mut(self)
      .ok_or(Error::Unknown)?
      .factories
      .insert(schema, factory);

    Ok(())
  }

  pub fn resolve_document_retrieval_location(
    &self,
    document_retrieval_location: &NodeLocation,
  ) -> Option<NodeLocation> {
    self
      .document_resolved
      .borrow()
      .get(document_retrieval_location)
      .cloned()
  }

  pub fn get_documents(&self) -> BTreeMap<NodeLocation, E> {
    self
      .documents
      .borrow()
      .values()
      .flat_map(|document| document.get_document_elements())
      .collect()
  }

  pub fn resolve_document_location(&self, node_location: &NodeLocation) -> NodeLocation {
    self
      .node_documents
      .borrow()
      .get(node_location)
      .unwrap()
      .clone()
  }

  pub fn get_item(&self, document_location: &NodeLocation) -> Result<Rc<dyn Document<E>>, Error> {
    let document_location = document_location.clone();

    let documents = self.documents.borrow();
    let result = documents.get(&document_location).ok_or(Error::NotFound)?;
    let result = result.clone();

    Ok(result)
  }

  pub fn get_item_and_antecedents(
    &self,
    document_location: &NodeLocation,
  ) -> Result<Vec<Rc<dyn Document<E>>>, Error> {
    let mut results = Vec::new();
    let mut document_location = document_location.clone();

    loop {
      let result = self.get_item(&document_location)?;
      results.push(result.clone());

      let Some(antecedent_location) = result.get_antecedent_location() else {
        break;
      };

      document_location = antecedent_location.clone();
    }

    Ok(results)
  }

  /**
  Load nodes from a location. The retrieval location is the physical location of the node,
  it should be a root location
  */
  pub async fn load_from_location(
    self: &Rc<Self>,
    retrieval_location: &NodeLocation,
    given_location: &NodeLocation,
    antecedent_location: Option<&NodeLocation>,
    default_meta_schema_id: &str,
  ) -> Result<(), Error> {
    if !retrieval_location.is_root() {
      Err(Error::NotARoot)?
    }

    let mut queue = Default::default();
    self
      .load_from_location_with_queue(
        retrieval_location,
        given_location,
        antecedent_location,
        default_meta_schema_id,
        &mut queue,
      )
      .await?;

    self.load_from_queue(&mut queue).await?;

    Ok(())
  }

  async fn load_from_location_with_queue(
    self: &Rc<Self>,
    retrieval_location: &NodeLocation,
    given_location: &NodeLocation,
    antecedent_location: Option<&NodeLocation>,
    default_meta_schema_id: &str,
    queue: &mut Queue,
  ) -> Result<(), Error> {
    /*
    If the document is not in the cache
    */
    if !self.node_cache.borrow().contains_key(retrieval_location) {
      /*
      retrieve the document
      */
      let document_location = retrieval_location.set_root();
      let fetch_location = document_location.to_fetch_string();
      let data = (self.fetch_file)(fetch_location).await?;
      let document_node = serde_yaml::from_str(&data)?;
      let document_node = Rc::new(document_node);

      /*
      populate the cache with this document
      */
      self.fill_node_cache(&document_location, document_node)?;
    }

    queue.push((
      retrieval_location.clone(),
      given_location.clone(),
      antecedent_location.cloned(),
      default_meta_schema_id.to_owned(),
    ));

    Ok(())
  }

  /**
  Load nodes from a document. The retrieval location dopes not have to be root (may contain
  a hash). The document_node provided here is the actual document that is identified by the
  retrieval_location and the given_location.
  */
  pub async fn load_from_node(
    self: &Rc<Self>,
    retrieval_location: &NodeLocation,
    given_location: &NodeLocation,
    antecedent_location: Option<&NodeLocation>,
    node: NodeRc,
    default_meta_schema_id: &str,
  ) -> Result<(), Error> {
    let mut queue = Default::default();

    self
      .load_from_node_with_queue(
        retrieval_location,
        given_location,
        antecedent_location,
        node,
        default_meta_schema_id,
        &mut queue,
      )
      .await?;

    self.load_from_queue(&mut queue).await?;

    Ok(())
  }

  async fn load_from_node_with_queue(
    self: &Rc<Self>,
    retrieval_location: &NodeLocation,
    given_location: &NodeLocation,
    antecedent_location: Option<&NodeLocation>,
    node: NodeRc,
    default_meta_schema_id: &str,
    queue: &mut Queue,
  ) -> Result<(), Error> {
    /*
    If the document is not in the cache
    */
    if !self.node_cache.borrow().contains_key(retrieval_location) {
      self.fill_node_cache(retrieval_location, node)?
    }

    queue.push((
      retrieval_location.clone(),
      given_location.clone(),
      antecedent_location.cloned(),
      default_meta_schema_id.to_owned(),
    ));

    Ok(())
  }

  /**
  the retrieval location is the location of the document node. The document node may be
  a part of a bigger document, if this is the case then it's retrieval location is not
  root.
  */
  fn fill_node_cache(
    &self,
    retrieval_location: &NodeLocation,
    document_node: NodeRc,
  ) -> Result<(), Error> {
    /*
    we add every node in the tree to the cache
    */
    for (pointer, node) in read_node(&[], document_node) {
      /*
      The retrieval location a unique, physical location where we can retrieve this node. The physical
      location of all nodes in the documents can be derived from the pointer and the retrieval_location
      of the document. It is possible that the retrieval location of the document is not root (has
      a hash). That is ok, then the pointer to the node is appended to the pointer of the document
      */
      let node_location = retrieval_location.push_pointer(pointer);

      let mut node_cache = self.node_cache.borrow_mut();
      if let Some(node_previous) = node_cache.get(&node_location) {
        /*
        If a node is already in the cache we won't override. We assume that this is the same node
        as it has the same identifier. This might happen if we load an embedded document first
        and then we load a document that contains the embedded document.
        */
        if node != *node_previous {
          Err(Error::NotTheSame)?
        }
      } else {
        node_cache.insert(node_location, node);
      }
    }

    Ok(())
  }

  /**
  Load documents from queue, drain the queue
  */
  async fn load_from_queue(self: &Rc<Self>, queue: &mut Queue) -> Result<(), Error> {
    /*
    This here will drain the queue.
    */
    while let Some((
      retrieval_location,
      given_location,
      antecedent_location,
      default_meta_schema_id,
    )) = queue.pop()
    {
      self
        .load_from_cache_with_queue(
          &retrieval_location,
          &given_location,
          antecedent_location.as_ref(),
          &default_meta_schema_id,
          queue,
        )
        .await?;
    }

    Ok(())
  }

  /**
  Load document and possibly adding data to the queue. This function is responsible for
  instantiating the documents. And also the load referenced and embedded documents by adding
  them to the queue.
  */
  async fn load_from_cache_with_queue(
    self: &Rc<Self>,
    retrieval_location: &NodeLocation,
    given_location: &NodeLocation,
    antecedent_location: Option<&NodeLocation>,
    default_meta_schema_id: &str,
    queue: &mut Queue,
  ) -> Result<(), Error> {
    if self
      .node_documents
      .borrow()
      .contains_key(retrieval_location)
    {
      return Ok(());
    }

    /*
    this has it's own scope so node_cache is dropped when we don't need it anymore.
    */
    let document = {
      let node_cache = self.node_cache.borrow();
      let node = node_cache
        .get(retrieval_location)
        .ok_or(Error::NotFound)?
        .clone();
      let document_type = (self.discover_document_type)(&node);

      let factory = self.factories.get(document_type).ok_or(Error::NotFound)?;

      factory(
        Rc::downgrade(self),
        DocumentConfiguration {
          retrieval_location: retrieval_location.clone(),
          given_location: given_location.clone(),
          antecedent_location: antecedent_location.cloned(),
          document_node: node,
        },
      )
    };
    let document_location = document.get_document_location();

    if self
      .document_resolved
      .borrow_mut()
      .insert(retrieval_location.clone(), document_location.clone())
      .is_some()
    {
      Err(Error::Conflict)?;
    }

    if self
      .documents
      .borrow_mut()
      .insert(document_location.clone(), document.clone())
      .is_some()
    {
      Err(Error::Conflict)?;
    }

    // Map node locations to this document
    for node_location in document.get_node_locations() {
      /*
      Inserts all node locations that belong to this document. We only expect locations
      that are part of this document and not part of embedded documents. So every node_location
      should be unique.
      */
      assert!(self
        .node_documents
        .borrow_mut()
        .insert(node_location.clone(), document_location.clone())
        .is_none());
    }

    let embedded_documents = document.get_embedded_documents();
    for embedded_document in embedded_documents {
      /*
      Find the node in the cache, it should be there, because the embedded document is always
      a descendant of this document. This document is cached, and so are all it's descendants.
      */
      let node = self
        .node_cache
        .borrow()
        .get(&embedded_document.retrieval_location)
        .ok_or(Error::NotFound)?
        .clone();
      self
        .load_from_node_with_queue(
          &embedded_document.retrieval_location,
          &embedded_document.given_location,
          Some(document_location),
          node,
          default_meta_schema_id,
          queue,
        )
        .await?;
    }

    let referenced_documents = document.get_referenced_documents();
    for referenced_document in referenced_documents {
      self
        .load_from_location_with_queue(
          &referenced_document.retrieval_location,
          &referenced_document.given_location,
          Some(document_location),
          default_meta_schema_id,
          queue,
        )
        .await?;
    }

    Ok(())
  }
}

#[cfg(test)]
mod tests {
  //
}
