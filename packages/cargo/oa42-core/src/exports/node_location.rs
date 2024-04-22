use super::with_error::with_error_reference;
use crate::utils::node_location::NodeLocation;
use std::{
  ffi::{c_char, CStr, CString},
  ptr::null_mut,
};

#[no_mangle]
extern "C" fn node_location_drop(node_location: *mut NodeLocation) {
  let _ = unsafe { Box::from_raw(node_location) };
}

#[no_mangle]
extern "C" fn node_location_clone(node_location: *const NodeLocation) -> *mut NodeLocation {
  let node_location = unsafe { &*node_location };
  let node_location = node_location.clone();
  let node_location = Box::new(node_location);
  Box::into_raw(node_location)
}

#[no_mangle]
extern "C" fn node_location_parse(
  input: *const c_char,
  error_reference: *mut usize,
) -> *mut NodeLocation {
  with_error_reference(error_reference, || {
    let input = unsafe { CStr::from_ptr(input) };
    let input = input.to_str()?;

    let node_location = input.parse()?;
    let node_location = Box::new(node_location);
    Ok(Box::into_raw(node_location))
  })
  .unwrap_or_else(null_mut)
}

#[no_mangle]
extern "C" fn node_location_join(
  node_location: *const NodeLocation,
  other_node_location: *const NodeLocation,
) -> *mut NodeLocation {
  let node_location = unsafe { &*node_location };
  let other_node_location = unsafe { &*other_node_location };

  let result = node_location.join(other_node_location);
  let result = Box::new(result);
  Box::into_raw(result)
}

#[no_mangle]
extern "C" fn node_location_to_string(
  node_location: *const NodeLocation,
  error_reference: *mut usize,
) -> *mut c_char {
  with_error_reference(error_reference, || {
    assert!(!node_location.is_null());

    let node_location = unsafe { &*node_location };

    let result = node_location.to_string();
    let result = CString::new(result)?;
    Ok(result.into_raw())
  })
  .unwrap_or_else(null_mut)
}

#[no_mangle]
extern "C" fn node_location_to_fetch_string(
  node_location: *const NodeLocation,
  error_reference: *mut usize,
) -> *mut c_char {
  with_error_reference(error_reference, || {
    let node_location = unsafe { &*node_location };

    let result = node_location.to_fetch_string();
    let result = CString::new(result)?;
    Ok(result.into_raw())
  })
  .unwrap_or_else(null_mut)
}

#[no_mangle]
extern "C" fn node_location_get_anchor(
  node_location: *const NodeLocation,
  error_reference: *mut usize,
) -> *mut c_char {
  with_error_reference(error_reference, || {
    let node_location = unsafe { &*node_location };

    let result = node_location.get_anchor();
    let Some(result) = result else {
      return Ok(null_mut());
    };
    let result = CString::new(result)?;
    let result = Box::new(result);
    Ok(result.into_raw())
  })
  .unwrap_or_else(null_mut)
}

#[no_mangle]
extern "C" fn node_location_get_pointer(node_location: *const NodeLocation) -> *mut Vec<String> {
  let node_location = unsafe { &*node_location };

  let result = node_location.get_pointer();
  let Some(result) = result else {
    return null_mut();
  };
  let result = result.into_iter().map(str::to_owned).collect();
  let result = Box::new(result);
  Box::into_raw(result)
}

#[no_mangle]
extern "C" fn node_location_get_path(node_location: *const NodeLocation) -> *mut Vec<String> {
  let node_location = unsafe { &*node_location };

  let result = node_location.get_path();
  let result = result.into_iter().map(str::to_owned).collect();
  let result = Box::new(result);
  Box::into_raw(result)
}

#[no_mangle]
extern "C" fn node_location_get_hash(node_location: *const NodeLocation) -> *mut Vec<String> {
  let node_location = unsafe { &*node_location };

  let result = node_location.get_hash();
  let result = result.into_iter().map(str::to_owned).collect();
  let result = Box::new(result);
  Box::into_raw(result)
}

#[no_mangle]
extern "C" fn node_location_set_anchor(
  node_location: *const NodeLocation,
  anchor: *mut c_char,
  error_reference: *mut usize,
) -> *mut NodeLocation {
  with_error_reference(error_reference, || {
    let node_location = unsafe { &*node_location };
    let anchor = unsafe { CString::from_raw(anchor) };
    let anchor = anchor.to_str()?;
    let anchor = anchor.to_owned();

    let result = node_location.set_anchor(anchor);
    let result = Box::new(result);
    Ok(Box::into_raw(result))
  })
  .unwrap_or_else(null_mut)
}

#[no_mangle]
extern "C" fn node_location_set_pointer(
  node_location: *mut NodeLocation,
  pointer: *const Vec<String>,
) -> *mut NodeLocation {
  let node_location = unsafe { &*node_location };
  let pointer = unsafe { &*pointer };

  let result = node_location.set_pointer(pointer);
  let result = Box::new(result);
  Box::into_raw(result)
}

#[no_mangle]
extern "C" fn node_location_push_pointer(
  node_location: *mut NodeLocation,
  pointer: *const Vec<String>,
) -> *mut NodeLocation {
  let node_location = unsafe { &*node_location };
  let pointer = unsafe { &*pointer };

  let result = node_location.push_pointer(pointer);
  let result = Box::new(result);
  Box::into_raw(result)
}

#[no_mangle]
extern "C" fn node_location_set_root(node_location: *mut NodeLocation) -> *mut NodeLocation {
  let node_location = unsafe { &*node_location };

  let result = node_location.set_root();
  let result = Box::new(result);
  Box::into_raw(result)
}
