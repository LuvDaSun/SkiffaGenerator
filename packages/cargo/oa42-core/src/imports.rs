use crate::utils::key::Key;
use std::ffi::c_char;

extern "C" {
  /// Invokes a callback function identified by a `Key`.
  ///
  /// This function is intended to be called from Rust and executed in an external
  /// environment (e.g., a host application or a different programming language runtime).
  /// The actual callback associated with the `Key` is defined and managed outside of Rust.
  ///
  /// # Parameters
  ///
  /// - `callback`: A `Key` that uniquely identifies the callback function to be invoked.
  ///
  /// # Safety
  ///
  /// This function is `unsafe` because it involves FFI and the correctness of the execution
  /// depends on the external environment adhering to the expected interface and behavior.
  pub fn host_invoke_callback(callback: Key);

  /// Fetches a file from a specified location and returns its content via a callback.
  ///
  /// This function requests a file from an external environment, which could be a host
  /// application or a different programming language runtime. The content of the file is
  /// returned asynchronously through a callback function identified by a `Key`.
  ///
  /// # Parameters
  ///
  /// - `location`: A pointer to a null-terminated string representing the file's location.
  ///   The string must be valid for the duration of the call.
  ///
  /// - `data`: A pointer to a pointer where the file's content will be stored. The memory
  ///   allocated for the file's content will be managed by the external environment, and
  ///   it's the caller's responsibility to free it if necessary.
  ///
  /// - `callback`: A `Key` that uniquely identifies the callback function to be invoked with
  ///   the file's content once it is available.
  ///
  /// # Safety
  ///
  /// This function is `unsafe` for several reasons:
  /// - It involves FFI, which means the Rust compiler cannot guarantee memory safety.
  /// - The `location` and `data` pointers must point to valid memory.
  /// - The lifetime and ownership of the memory pointed to by `data` are managed externally,
  ///   requiring careful handling to avoid memory leaks or undefined behavior.
  pub fn host_fetch_file(location: *mut c_char, data: *mut *mut c_char, callback: Key);
}
