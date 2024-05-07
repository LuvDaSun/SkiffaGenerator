use crate::utils::key::Key;
use once_cell::sync::Lazy;
use std::{collections::BTreeMap, sync::Mutex};

type Callbacks = Lazy<Mutex<BTreeMap<Key, Box<dyn FnOnce() + Send>>>>;
static CALLBACKS: Callbacks = Lazy::new(Default::default);

pub fn register_callback(callback: impl FnOnce() + Send + 'static) -> Key {
  let key = Key::new();
  let mut callbacks = CALLBACKS.lock().unwrap();
  let callback = Box::new(callback);
  assert!(callbacks.insert(key, callback).is_none());
  key
}

pub fn invoke_callback(key: Key) {
  let mut callbacks = CALLBACKS.lock().unwrap();
  if let Some(callback) = callbacks.remove(&key) {
    (callback)();
  }
}
