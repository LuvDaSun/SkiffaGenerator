use crate::executor::wake;
use crate::utils::key::Key;

#[no_mangle]
extern "C" fn invoke_callback(key: Key) {
  crate::callbacks::invoke_callback(key);
  wake();
}
