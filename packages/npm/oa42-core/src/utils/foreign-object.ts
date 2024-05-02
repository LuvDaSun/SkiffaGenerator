import assert from "assert";

// Initializes a FinalizationRegistry that calls the provided cleanup callback.
const finalizationRegistry = new FinalizationRegistry<(() => void) | undefined>((drop) => drop?.());

/**
 * Represents an abstract class for foreign objects that require manual resource management.
 * This class provides mechanisms to manage lifecycle and resource cleanup of foreign objects.
 */
export abstract class ForeignObject {
  private token = {}; // A unique token used for the finalization registry to manage cleanup.

  /**
   * Indicates whether this object has been disposed.
   */
  private disposed = false;

  /**
   * Indicates whether this object is responsible for releasing its own resources.
   */
  private responsible = true;

  /**
   * Constructs a new instance of the ForeignObject class.
   * @param pointer The native pointer to the foreign object. Must not be 0.
   * @param drop A function that will be called to release the resources of the foreign object.
   */
  constructor(
    public readonly pointer: number,
    private readonly drop?: () => void,
  ) {
    assert(pointer !== 0); // Ensure the pointer is valid.

    // Register the object with the finalization registry for cleanup when it's garbage collected.
    finalizationRegistry.register(this, drop, this.token);
  }

  /**
   * Marks the object as not responsible for managing its resources.
   * After calling this method, the object will not release its resources automatically.
   */
  public abandon() {
    this.responsible = false;
    finalizationRegistry.unregister(this.token); // Unregister from the finalization registry.
  }

  /**
   * Disposes of the resources associated with this object.
   * This method is intended to be called when the object is no longer needed, and it will release the resources
   * if the object is marked as responsible for its own resource management. It also ensures that the object
   * is unregistered from the finalization registry to prevent the cleanup callback from being called
   * after manual disposal.
   *
   * This method implements the dispose pattern using the `Symbol.dispose` well-known symbol, allowing
   * it to be used with the `using` statement or `dispose` function in environments that support it.
   *
   * Throws:
   * - An AssertionError if called on an object that has already been disposed.
   */
  [Symbol.dispose]() {
    assert.equal(this.disposed, false); // Ensure the object has not already been disposed.
    if (this.responsible) {
      finalizationRegistry.unregister(this.token); // Unregister from the finalization registry.
      this.drop?.(); // Release resources if responsible.
    }
    this.disposed = true; // Mark the object as disposed.
  }
}
