use crate::error::Error;
use futures::Future;

pub fn with_error_reference<R, T>(error_reference: *mut usize, task: T) -> Option<R>
where
  T: FnOnce() -> Result<R, Error>,
{
  match (task)() {
    Ok(result) => Some(result),
    Err(error) => {
      let error_reference = unsafe { &mut *error_reference };
      *error_reference = error as usize;
      None
    }
  }
}

pub async fn with_error_reference_future<R, T, F>(error_reference: *mut usize, task: T) -> Option<R>
where
  T: FnOnce() -> F,
  F: Future<Output = Result<R, Error>>,
{
  match (task)().await {
    Ok(result) => Some(result),
    Err(error) => {
      let error_reference = unsafe { &mut *error_reference };
      *error_reference = error as usize;
      None
    }
  }
}
