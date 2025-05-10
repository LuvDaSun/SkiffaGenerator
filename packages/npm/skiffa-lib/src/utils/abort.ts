export function setupAbortBubble(parentController: AbortController, childSignal: AbortSignal) {
  if (childSignal.aborted) {
    parentController.abort();
  } else {
    const parentSignal = parentController.signal;
    const parentAbortHandler = () => {
      parentSignal.removeEventListener("abort", parentAbortHandler);
      childSignal.removeEventListener("abort", childAbortHandler);
    };
    const childAbortHandler = () => {
      parentController.abort();
    };
    parentSignal.addEventListener("abort", parentAbortHandler);
    childSignal.addEventListener("abort", childAbortHandler);
  }
}
