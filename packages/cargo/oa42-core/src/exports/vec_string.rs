use super::with_error::with_error_reference;
use crate::error::Error;
use std::{
  ffi::{c_char, CString},
  ptr::null_mut,
  usize,
};

#[no_mangle]
extern "C" fn vec_string_new(capacity: usize) -> *mut Vec<String> {
  let vec = Vec::with_capacity(capacity);
  let vec = Box::new(vec);

  Box::into_raw(vec)
}

#[no_mangle]
extern "C" fn vec_string_drop(vec: *mut Vec<String>) {
  let _ = unsafe { Box::from_raw(vec) };
}

#[no_mangle]
extern "C" fn vec_string_len(vec: *const Vec<String>) -> usize {
  let vec = unsafe { &*vec };

  vec.len()
}

#[no_mangle]
extern "C" fn vec_string_get(
  vec: *const Vec<String>,
  index: usize,
  error_reference: *mut usize,
) -> *mut c_char {
  with_error_reference(error_reference, || {
    let vec = unsafe { &*vec };

    let value = vec.get(index).ok_or(Error::NotFound)?;
    let value = CString::new(value.clone())?;

    Ok(value.into_raw())
  })
  .unwrap_or_else(null_mut)
}

#[no_mangle]
extern "C" fn vec_string_push(
  vec: *mut Vec<String>,
  value: *mut c_char,
  error_reference: *mut usize,
) {
  with_error_reference(error_reference, || {
    let vec = unsafe { &mut *vec };
    let value = unsafe { CString::from_raw(value) };
    let value = value.to_str()?;
    let value = value.to_owned();

    vec.push(value);

    Ok(())
  })
  .unwrap_or(())
}
