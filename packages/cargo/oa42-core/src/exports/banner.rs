use super::with_error::with_error_reference;
use std::{
  ffi::{c_char, CStr, CString},
  ptr::null_mut,
};

#[no_mangle]
extern "C" fn banner(
  prefix: *const c_char,
  version: *const c_char,
  error_reference: *mut usize,
) -> *mut c_char {
  with_error_reference(error_reference, || {
    let prefix = unsafe { CStr::from_ptr(prefix) };
    let prefix = prefix.to_str()?;

    let version = unsafe { CStr::from_ptr(version) };
    let version = version.to_str()?;

    let result = crate::utils::banner(prefix, version);
    let result = CString::new(result)?;
    Ok(result.into_raw())
  })
  .unwrap_or_else(null_mut)
}
