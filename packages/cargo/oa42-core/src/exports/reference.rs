use std::{ffi::c_void, ptr::null_mut};

#[no_mangle]
extern "C" fn reference_new() -> *mut *mut c_void {
  let pointer_box = Box::new(null_mut());
  Box::into_raw(pointer_box)
}

#[no_mangle]
extern "C" fn reference_drop(pointer_box: *mut *mut c_void) {
  let _ = unsafe { Box::from_raw(pointer_box) };
}
