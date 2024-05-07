use std::ffi::{c_char, CString};

#[no_mangle]
extern "C" fn c_string_new(size: usize) -> *mut c_char {
  let c_string = unsafe { CString::from_vec_unchecked(vec![0; size]) };
  c_string.into_raw()
}

#[no_mangle]
extern "C" fn c_string_drop(c_string: *mut c_char) {
  let _ = unsafe { CString::from_raw(c_string) };
}
