use once_cell::sync::Lazy;
use regex::{Regex, RegexBuilder};
use std::{error::Error, fmt, hash::Hash, iter, str::FromStr};

pub static URL_REGEX: Lazy<Regex> = Lazy::new(|| {
  RegexBuilder::new(r"^([a-z]+\:(?:\/\/)?[^\/]*)?([^\?\#]*?)?(\?.*?)?(\#.*?)?$")
    .unicode(true)
    .case_insensitive(true)
    .build()
    .unwrap()
});

#[derive(
  Clone, Debug, Hash, PartialEq, Eq, PartialOrd, Ord, serde::Serialize, serde::Deserialize,
)]
#[serde(try_from = "&str")]
#[serde(into = "String")]
pub struct NodeLocation {
  origin: String,
  path: Vec<String>,
  query: String,
  hash: Vec<String>,
}

impl NodeLocation {
  fn new(origin: String, path: Vec<String>, query: String, hash: Vec<String>) -> Self {
    Self {
      origin,
      path: normalize_path(path),
      query,
      hash: normalize_hash(hash),
    }
  }

  pub fn get_anchor(&self) -> Option<String> {
    if self.hash.len() > 1 {
      None
    } else {
      self.hash.first().cloned()
    }
  }

  pub fn get_pointer(&self) -> Option<Vec<String>> {
    if self.hash.len() > 1 {
      Some(self.hash.iter().skip(1).cloned().collect())
    } else {
      None
    }
  }

  pub fn get_path(&self) -> Vec<String> {
    self.path.to_vec()
  }

  pub fn get_hash(&self) -> Vec<String> {
    self.hash.to_vec()
  }

  pub fn is_root(&self) -> bool {
    self.hash.is_empty()
  }

  /*
  Set the anchor of this location, replacing the pointer.
  */
  pub fn set_anchor(&self, value: String) -> Self {
    let mut cloned = self.clone();
    cloned.hash = iter::once(value).collect();
    cloned
  }

  /*
  Replace pointer
  */
  pub fn set_pointer(&self, value: Vec<String>) -> Self {
    let mut cloned = self.clone();
    cloned.hash = normalize_hash(iter::once(String::new()).chain(value));
    cloned
  }

  /*
  Removes pointer and anchor (the hash) from this location.
  */
  pub fn set_root(&self) -> Self {
    let mut cloned = self.clone();
    cloned.hash = Default::default();
    cloned
  }

  /*
  Return a location that is the parent of this one
  */
  pub fn set_parent(&self) -> Self {
    let pointer = self.get_pointer();
    let Some(mut pointer) = pointer else {
      return self.clone();
    };
    pointer.pop();

    if pointer.is_empty() {
      self.set_root()
    } else {
      self.set_pointer(pointer)
    }
  }

  /*
  Append to pointer
  */
  pub fn push_pointer(&self, value: Vec<String>) -> Self {
    let pointer: Vec<_> = self
      .get_pointer()
      .unwrap_or_default()
      .into_iter()
      .chain(value)
      .collect();

    self.set_pointer(pointer)
  }

  /**
  Get the part of the location before the hash. This could be used to get data from a server
  or file system.
  */
  pub fn to_fetch_string(&self) -> String {
    let origin = &self.origin;
    let path = self
      .path
      .iter()
      .map(|part| urlencoding::encode(part))
      .collect::<Vec<_>>()
      .join("/");
    let query = &self.query;

    return origin.to_string() + path.as_str() + query.as_str();
  }

  pub fn join(&self, other: &NodeLocation) -> Self {
    if !other.origin.is_empty() {
      return other.clone();
    }

    if !other.path.is_empty() {
      if other.path.first().unwrap().is_empty() {
        return NodeLocation::new(
          self.origin.clone(),
          other.path.clone(),
          other.query.clone(),
          other.hash.clone(),
        );
      } else {
        return NodeLocation::new(
          self.origin.clone(),
          self
            .path
            .iter()
            .take(self.path.len() - 1)
            .chain(other.path.iter())
            .cloned()
            .collect(),
          other.query.clone(),
          other.hash.clone(),
        );
      }
    }

    if !other.query.is_empty() {
      return NodeLocation::new(
        self.origin.clone(),
        self.path.clone(),
        other.query.clone(),
        other.hash.clone(),
      );
    }

    NodeLocation::new(
      self.origin.clone(),
      self.path.clone(),
      self.query.clone(),
      other.hash.clone(),
    )
  }
}

impl TryFrom<&str> for NodeLocation {
  type Error = ParseLocationError;

  fn try_from(value: &str) -> Result<Self, Self::Error> {
    let input = value.replace('\\', "/");

    let input_captures = URL_REGEX
      .captures(&input)
      .ok_or(ParseLocationError::InvalidInput)?;

    let origin_capture = input_captures.get(1);
    let path_capture = input_captures.get(2);
    let query_capture = input_captures.get(3);
    let hash_capture = input_captures.get(4);

    let origin = origin_capture
      .map(|capture| capture.as_str())
      .map(|capture| capture.to_string())
      .unwrap_or_default();

    let path = path_capture
      .map(|capture| capture.as_str())
      .unwrap_or_default();
    let path = if path.is_empty() {
      Default::default()
    } else {
      path
        .split('/')
        .map(|part| urlencoding::decode(part).map_err(|_error| ParseLocationError::DecodeError))
        .map(|part| part.map(unescape_hash))
        .collect::<Result<_, _>>()?
    };

    let query = query_capture
      .map(|capture| capture.as_str())
      .map(|capture| capture.to_string())
      .unwrap_or_default();

    let hash = hash_capture
      .map(|capture| capture.as_str())
      .map(|capture| capture.trim_start_matches('#'))
      .unwrap_or_default();
    let hash = hash
      .split('/')
      .map(|part| urlencoding::decode(part).map_err(|_error| ParseLocationError::DecodeError))
      .map(|part| part.map(unescape_hash))
      .collect::<Result<_, _>>()?;

    Ok(Self::new(origin, path, query, hash))
  }
}

impl From<&NodeLocation> for String {
  fn from(value: &NodeLocation) -> Self {
    let origin = &value.origin;
    let path = value
      .path
      .iter()
      .map(|part| urlencoding::encode(part))
      .collect::<Vec<_>>()
      .join("/");
    let query = &value.query;

    let hash = "#".to_string()
      + &value
        .hash
        .iter()
        .map(escape_hash)
        .map(|part| urlencoding::encode(&part).into_owned())
        .collect::<Vec<_>>()
        .join("/");

    return origin.to_string() + path.as_str() + query.as_str() + hash.as_str();
  }
}

impl From<NodeLocation> for String {
  fn from(value: NodeLocation) -> Self {
    (&value).into()
  }
}

impl fmt::Display for NodeLocation {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    let s: String = self.into();
    write!(f, "{}", s)
  }
}

impl FromStr for NodeLocation {
  type Err = ParseLocationError;

  fn from_str(input: &str) -> Result<Self, Self::Err> {
    input.try_into()
  }
}

#[derive(PartialEq, Eq, Clone, Copy, Debug)]
pub enum ParseLocationError {
  InvalidInput,
  DecodeError,
}

impl fmt::Display for ParseLocationError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      ParseLocationError::InvalidInput => write!(f, "Invalid input"),
      ParseLocationError::DecodeError => write!(f, "Decode error"),
    }
  }
}

impl Error for ParseLocationError {}

fn escape_hash(input: impl AsRef<str>) -> String {
  input.as_ref().replace('~', "~0").replace('/', "~1")
}

fn unescape_hash(input: impl AsRef<str>) -> String {
  input.as_ref().replace("~1", "/").replace("~0", "~")
}

fn normalize_path(path: impl IntoIterator<Item = impl ToString>) -> Vec<String> {
  let mut path: Vec<_> = path.into_iter().map(|part| part.to_string()).collect();

  let mut path_index = 0;

  while path_index < path.len() {
    // first or last parts may be empty
    if (path_index == 0 || path_index == path.len() - 1) && path[path_index].is_empty() {
      path_index += 1;
      continue;
    }

    // empty parts, or paths that are a dot are removed
    if path[path_index].is_empty() || path[path_index] == "." {
      path.remove(path_index);
      continue;
    }

    if path[path_index] == ".." && path_index > 0 && path[path_index - 1].is_empty() {
      path.remove(path_index);
      continue;
    }

    if path[path_index] == ".." && path_index > 0 && path[path_index - 1] != ".." {
      path.remove(path_index);
      path_index -= 1;
      path.remove(path_index);
      continue;
    }

    path_index += 1;
  }

  path
}

fn normalize_hash(hash: impl IntoIterator<Item = impl ToString>) -> Vec<String> {
  let hash: Vec<_> = hash
    .into_iter()
    .map(|part| part.to_string())
    .enumerate()
    .filter(|(index, part)| *index == 0 || !part.is_empty())
    .map(|(_index, part)| part)
    .collect();

  // last can only be empty if it is the only element!
  if hash.is_empty() || hash.last().unwrap().is_empty() {
    return Default::default();
  }

  hash
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_escape_hash() {
    let actual = escape_hash("~~//:-)");
    let expected = "~0~0~1~1:-)".to_string();

    assert_eq!(actual, expected);
  }

  #[test]
  fn test_unescape_hash() {
    let actual = unescape_hash("~~~0~~~1~01:-)");
    let expected = "~~~~~/~1:-)".to_string();

    assert_eq!(actual, expected);
  }

  #[test]
  fn test_normalize_path() {
    do_test(vec!["", "a", "b", "..", "c"], vec!["", "a", "c"]);

    do_test(vec!["", "..", "..", "a", "b", "c"], vec!["", "a", "b", "c"]);

    do_test(
      vec!["..", "..", "a", "b", "c"],
      vec!["..", "..", "a", "b", "c"],
    );

    do_test(
      vec!["a", "b", "c", "..", "..", "..", "..", "x"],
      vec!["..", "x"],
    );

    fn do_test(actual: Vec<&str>, expected: Vec<&str>) {
      let actual = normalize_path(actual);
      assert_eq!(actual, expected);
    }
  }

  #[test]
  fn test_url_regex() {
    do_test(
      "http://www.example.com",
      vec!["http://www.example.com", "", "", ""],
    );

    do_test(
      "http://www.example.com/",
      vec!["http://www.example.com", "/", "", ""],
    );

    do_test(
      "http://www.example.com/a/b/c",
      vec!["http://www.example.com", "/a/b/c", "", ""],
    );

    do_test(
      "http://www.example.com/a/b/c?123",
      vec!["http://www.example.com", "/a/b/c", "?123", ""],
    );

    do_test(
      "http://www.example.com/a/b/c?123#xxx",
      vec!["http://www.example.com", "/a/b/c", "?123", "#xxx"],
    );

    do_test(
      "http://www.example.com/a/b/c#xxx",
      vec!["http://www.example.com", "/a/b/c", "", "#xxx"],
    );

    do_test("/a/b/c#xxx", vec!["", "/a/b/c", "", "#xxx"]);

    do_test("a/b/c?xxx", vec!["", "a/b/c", "?xxx", ""]);

    do_test("whoop", vec!["", "whoop", "", ""]);

    do_test("#", vec!["", "", "", "#"]);

    fn do_test(actual: &str, expected: Vec<&str>) {
      let actual: Vec<_> = URL_REGEX
        .captures(actual)
        .unwrap()
        .iter()
        .skip(1)
        .map(|capture| capture.map(|capture| capture.as_str()))
        .map(|capture| capture.unwrap_or_default())
        .collect();

      assert_eq!(actual, expected);
    }
  }

  #[test]
  fn node_location_parse_path() {
    do_test("a", vec!["a"]);

    do_test("a#", vec!["a"]);

    do_test("a#/", vec!["a"]);

    do_test("a#/1/2/3", vec!["a"]);

    do_test("a#/1/2/3#", vec!["a"]);

    fn do_test(actual: &str, expected: Vec<&str>) {
      let actual = actual.parse::<NodeLocation>().unwrap().path;
      assert_eq!(actual, expected);
    }
  }

  #[test]
  fn node_location_parse_pointer() {
    do_test("", vec![]);

    do_test("#", vec![]);

    do_test("#/", vec![]);

    do_test("#/1/2/3", vec!["", "1", "2", "3"]);

    fn do_test(actual: &str, expected: Vec<&str>) {
      let actual = actual.parse::<NodeLocation>().unwrap().hash;
      assert_eq!(actual, expected);
    }
  }

  #[test]
  fn node_location_join() {
    do_test(
      "http://a.b.c/d/e/f#/g/h/i",
      "http://x.y.z/",
      "http://x.y.z/",
    );

    do_test("http://a.b.c/d/e/f#/g/h/i", "c:\\x", "c:/x");

    do_test("http://a.b.c/d/e/f#/g/h/i", "/x/y/z", "http://a.b.c/x/y/z#");

    do_test(
      "http://a.b.c/d/e/f#/g/h/i",
      "/x/y/z/",
      "http://a.b.c/x/y/z/#",
    );

    do_test("c:\\a\\d\\e\\f", "/x/y/z/", "c:/x/y/z/#");

    do_test(
      "http://a.b.c/d/e/f#/g/h/i",
      "x/y/z/",
      "http://a.b.c/d/e/x/y/z/#",
    );

    do_test("c:\\a\\d\\e\\f", "x/y/z/", "c:/a/d/e/x/y/z/#");

    do_test(
      "http://a.b.c/d/e/f/#/g/h/i",
      "x/y/z/",
      "http://a.b.c/d/e/f/x/y/z/#",
    );

    do_test(
      "http://a.b.c/d/e/f/#/g/h/i",
      "#/x/y/z/",
      "http://a.b.c/d/e/f/#/x/y/z/",
    );

    do_test(
      "http://a.b.c/d/e/f/#/g/h/i",
      "?x=y",
      "http://a.b.c/d/e/f/?x=y",
    );

    do_test("http://a.b.c/d/e?f#/g/h/i", "?x=y", "http://a.b.c/d/e?x=y");

    fn do_test(base: &str, other: &str, expected: &str) {
      let actual = base
        .parse::<NodeLocation>()
        .unwrap()
        .join(&other.parse().unwrap());
      let expected = expected.parse::<NodeLocation>().unwrap();
      assert_eq!(actual, expected);
    }
  }
}
