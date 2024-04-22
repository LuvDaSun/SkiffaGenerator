use crate::error::Error;

pub async fn fetch_file_hosted(location: &str) -> Result<String, Error> {
  use crate::callbacks::register_callback;
  use futures::channel::oneshot;
  use std::{
    ffi::{c_char, CString},
    ptr::null_mut,
  };

  let location = CString::new(location.to_owned()).unwrap();
  let location = location.into_raw();

  let data = Box::new(null_mut() as *mut c_char);
  let data = Box::into_raw(data);

  let (ready_sender, ready_receiver) = oneshot::channel();
  let callback_key = register_callback(|| {
    ready_sender.send(()).unwrap();
  });
  unsafe {
    crate::imports::host_fetch_file(location, data, callback_key);
  }
  ready_receiver.await.unwrap();

  let data = unsafe { Box::from_raw(data) };
  let data = *data;
  let data = unsafe { CString::from_raw(data) };
  let data = data.to_str().unwrap();
  let data = data.to_owned();

  Ok(data)
}

#[cfg(not(target_os = "unknown"))]
pub async fn fetch_file(location: &str) -> Result<String, Error> {
  use async_std::fs::File;
  use async_std::io::ReadExt;

  if location.starts_with("http://") || location.starts_with("https://") {
    let mut response = surf::get(location).await?;
    let data = response.body_string().await?;
    Ok(data)
  } else {
    let mut file = File::open(location).await?;
    let metadata = file.metadata().await?;
    let mut data = String::with_capacity(metadata.len() as usize);
    file.read_to_string(&mut data).await?;
    Ok(data)
  }
}
