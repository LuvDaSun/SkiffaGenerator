use std::sync::atomic::{AtomicUsize, Ordering};

static NEXT_KEY: AtomicUsize = AtomicUsize::new(1);

#[derive(Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Clone, Copy)]
#[repr(transparent)]
pub struct Key(usize);

#[allow(clippy::new_without_default)]
impl Key {
  pub fn new() -> Self {
    Self(NEXT_KEY.fetch_add(1, Ordering::Relaxed))
  }
}
