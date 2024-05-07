use serde_json::Value;
use std::iter::once;

pub fn read_json_node(prefix: &[String], node: Value) -> Vec<(Vec<String>, Value)> {
  match &node {
    Value::Array(array_value) => once((prefix.to_owned(), node.clone()))
      .chain(
        array_value
          .iter()
          .enumerate()
          .flat_map(|(index, element_value)| {
            read_json_node(
              &prefix
                .iter()
                .cloned()
                .chain(once(index.to_string()))
                .collect::<Vec<_>>(),
              element_value.clone(),
            )
          }),
      )
      .collect(),
    Value::Object(object_value) => once((prefix.to_owned(), node.clone()))
      .chain(object_value.iter().flat_map(|(name, element_value)| {
        read_json_node(
          &prefix
            .iter()
            .cloned()
            .chain(once(name.to_string()))
            .collect::<Vec<_>>(),
          element_value.clone(),
        )
      }))
      .collect(),
    _ => once((prefix.to_owned(), node)).collect(),
  }
}
