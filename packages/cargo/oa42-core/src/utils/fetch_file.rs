pub enum FetchFileError {
  IoError,
  HttpError,
}

impl From<std::io::Error> for FetchFileError {
  fn from(_value: std::io::Error) -> Self {
    Self::IoError
  }
}

#[cfg(not(target_os = "unknown"))]
impl From<surf::Error> for FetchFileError {
  fn from(_value: surf::Error) -> Self {
    Self::HttpError
  }
}

#[cfg(target_os = "unknown")]
pub async fn fetch_file(location: &str) -> Result<String, FetchFileError> {
  // use wasm_bindgen::prelude::*;
  // use wasm_bindgen_futures::JsFuture;
  // use web_sys::{Request, RequestInit, RequestMode, Response};

  // let mut opts = RequestInit::new();
  // opts.method("GET");
  // opts.mode(RequestMode::Cors);

  // let request = Request::new_with_str_and_init(&url, &opts)?;

  // let window = web_sys::window().unwrap();
  // let fetch = window.fetch_with_request(&request);

  // let resp_value = JsFuture::from(fetch).await?;

  // let resp: Response = resp_value.dyn_into().unwrap();

  // let json = JsFuture::from(resp.text()?).await?;
  Ok("{}".to_owned())
}

#[cfg(not(target_os = "unknown"))]
pub async fn fetch_file(location: &str) -> Result<String, FetchFileError> {
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
