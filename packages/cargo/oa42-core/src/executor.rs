use crate::imports::host_invoke_callback;
use crate::utils::key::Key;
use futures::task::LocalSpawnExt;
use futures::{executor::LocalPool, Future};
use std::cell::RefCell;

thread_local! {
  static EXECUTOR: RefCell<LocalPool> = RefCell::new(LocalPool::new());
}

/// Wakes up the local executor and runs all pending tasks.
///
/// This function is used to ensure that all pending tasks are executed when needed.
/// It borrows the mutable reference to the local pool and runs all tasks until they are stalled.
///
pub fn wake() {
  EXECUTOR.with_borrow_mut(|pool| pool.run_until_stalled());
}

/// Spawns a new task and runs it on the local executor.
///
/// After the task is completed, it calls the provided `callback` function using the `host_invoke_callback` function.
///
/// # Arguments
///
/// * `callback` - A unique identifier for the callback function to be invoked.
/// * `task` - A future that represents the task to be executed.
///
/// # Returns
///
/// This function does not return any value.
///
/// # Panics
///
/// This function may panic if the task fails to spawn or if the `host_invoke_callback` function fails.
///
pub fn spawn_and_callback(callback: Key, task: impl Future<Output = ()> + 'static) {
  EXECUTOR.with_borrow_mut(|pool| {
    let spawner = pool.spawner();
    spawner
      .spawn_local(async move {
        task.await;
        unsafe {
          host_invoke_callback(callback);
        }
      })
      .unwrap();
    pool.run_until_stalled()
  });
}
