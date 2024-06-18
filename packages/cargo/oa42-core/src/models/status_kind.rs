use std::{num, ops, str::FromStr};

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum StatusKind {
  Default,
  Class(usize),
  Code(usize),
}

impl IntoIterator for &StatusKind {
  type Item = usize;
  type IntoIter = ops::Range<usize>;

  fn into_iter(self) -> Self::IntoIter {
    match self {
      StatusKind::Default => 100..600,
      StatusKind::Class(value) => value * 100..value * 100 + 100,
      StatusKind::Code(value) => *value..value + 1,
    }
  }
}

impl FromStr for StatusKind {
  type Err = StatusKindParseError;

  fn from_str(value: &str) -> Result<Self, Self::Err> {
    Ok(match value {
      "default" => Self::Default,
      "1XX" => Self::Class(1),
      "2XX" => Self::Class(2),
      "3XX" => Self::Class(3),
      "4XX" => Self::Class(4),
      "5XX" => Self::Class(5),
      value => {
        let value: usize = value.parse()?;
        if !(100..600).contains(&value) {
          Err(StatusKindParseError)?
        }
        Self::Code(value)
      }
    })
  }
}

#[allow(clippy::to_string_trait_impl)]
impl ToString for StatusKind {
  fn to_string(&self) -> String {
    match self {
      Self::Default => "default".to_owned(),
      Self::Class(value) => format!("{}XX", value),
      Self::Code(value) => format!("{}", value),
    }
  }
}

pub struct StatusKindParseError;

impl From<num::ParseIntError> for StatusKindParseError {
  fn from(_value: num::ParseIntError) -> Self {
    Self
  }
}

#[cfg(test)]
mod tests {
  use std::collections::BTreeSet;

  use super::StatusKind;

  #[test]
  fn test_sort() {
    let mut set = BTreeSet::new();

    set.insert(StatusKind::Class(1));
    set.insert(StatusKind::Default);
    set.insert(StatusKind::Class(2));
    set.insert(StatusKind::Code(200));
    set.insert(StatusKind::Code(201));
    set.insert(StatusKind::Code(204));

    assert_eq!(
      [
        StatusKind::Default,
        StatusKind::Class(1),
        StatusKind::Class(2),
        StatusKind::Code(200),
        StatusKind::Code(201),
        StatusKind::Code(204),
      ]
      .to_vec(),
      set.into_iter().collect::<Vec<_>>(),
    )
  }
}
