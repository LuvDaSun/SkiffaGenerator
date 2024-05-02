#[no_mangle]
extern "C" fn vec_usize_new(capacity: usize) -> *const Vec<usize> {
  let vec = Vec::with_capacity(capacity);
  let vec = Box::new(vec);

  Box::into_raw(vec)
}

#[no_mangle]
extern "C" fn vec_usize_drop(vec: *mut Vec<usize>) {
  let _ = unsafe { Box::from_raw(vec) };
}

#[no_mangle]
extern "C" fn vec_usize_len(vec: *const Vec<usize>) -> usize {
  let vec = unsafe { &*vec };

  vec.len()
}

#[no_mangle]
extern "C" fn vec_usize_push(vec: *mut Vec<usize>, value: usize) {
  let vec = unsafe { &mut *vec };

  vec.push(value);
}
