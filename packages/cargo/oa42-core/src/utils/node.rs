use core::fmt;
use serde::de;
use std::{collections::HashMap, rc::Rc};

pub type NodeRc = Rc<Node>;

#[derive(Debug, PartialEq)]
pub enum Node {
  Null,
  Bool(bool),
  Float(f64),
  String(String),
  Array(Vec<NodeRc>),
  Object(HashMap<String, NodeRc>),
}

impl Node {
  pub fn as_null(&self) -> Option<()> {
    match self {
      Node::Null => Some(()),
      _ => None,
    }
  }

  pub fn as_bool(&self) -> Option<bool> {
    match self {
      Node::Bool(value) => Some(*value),
      _ => None,
    }
  }

  pub fn as_float(&self) -> Option<f64> {
    match self {
      Node::Float(value) => Some(*value),
      _ => None,
    }
  }

  pub fn as_str(&self) -> Option<&str> {
    match self {
      Node::String(value) => Some(value.as_str()),
      _ => None,
    }
  }

  pub fn as_array(&self) -> Option<&Vec<NodeRc>> {
    match self {
      Node::Array(value) => Some(value),
      _ => None,
    }
  }

  pub fn as_object(&self) -> Option<&HashMap<String, NodeRc>> {
    match self {
      Node::Object(value) => Some(value),
      _ => None,
    }
  }
}

impl<'de> de::Deserialize<'de> for Node {
  fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
  where
    D: de::Deserializer<'de>,
  {
    deserializer.deserialize_any(ValueRcVisitor)
  }
}

struct ValueRcVisitor;

impl<'de> de::Visitor<'de> for ValueRcVisitor {
  type Value = Node;

  fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
    write!(formatter, "a value")
  }

  fn visit_unit<E>(self) -> Result<Self::Value, E>
  where
    E: de::Error,
  {
    Ok(Node::Null)
  }

  fn visit_bool<E>(self, value: bool) -> Result<Self::Value, E>
  where
    E: de::Error,
  {
    let result = value;
    Ok(Node::Bool(result))
  }

  fn visit_i64<E>(self, value: i64) -> Result<Self::Value, E>
  where
    E: de::Error,
  {
    let result = value as f64;
    Ok(Node::Float(result))
  }

  fn visit_u64<E>(self, value: u64) -> Result<Self::Value, E>
  where
    E: de::Error,
  {
    let result = value as f64;
    Ok(Node::Float(result))
  }

  fn visit_f64<E>(self, value: f64) -> Result<Self::Value, E>
  where
    E: de::Error,
  {
    let result = value;
    Ok(Node::Float(result))
  }

  fn visit_str<E>(self, value: &str) -> Result<Self::Value, E>
  where
    E: de::Error,
  {
    let result = value.to_owned();
    Ok(Node::String(result))
  }

  fn visit_seq<A>(self, mut value_seq: A) -> Result<Self::Value, A::Error>
  where
    A: de::SeqAccess<'de>,
  {
    let mut result = Vec::new();
    while let Some(element) = value_seq.next_element::<Node>()? {
      result.push(Rc::new(element));
    }
    Ok(Node::Array(result))
  }

  fn visit_map<A>(self, mut value_map: A) -> Result<Self::Value, A::Error>
  where
    A: de::MapAccess<'de>,
  {
    let mut result = HashMap::new();
    while let Some((key, value)) = value_map.next_entry::<String, Node>()? {
      result.insert(key, Rc::new(value));
    }
    Ok(Node::Object(result))
  }
}
