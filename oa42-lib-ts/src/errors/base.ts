/**
 * All errors in this package inherit from this base class, this makes it easy
 * to recognize errors that come from this package via `instanceof`.
 *
 * ```typescript
 * try {
 *  throw Error("not from this package")
 * }
 * catch(error) {
 *  if(error instanceof ErrorBase) {
 *    throw new Error("a cool error was thrown!")
 *  }
 *  else {
 *    throw new Error("an uncool error was thrown...")
 *  }
 * }
 * ```
 */
export abstract class ErrorBase extends Error {
  //
}
