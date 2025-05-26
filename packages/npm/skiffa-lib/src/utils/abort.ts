export function setupAbortBubble(parentController: AbortController, childSignal: AbortSignal) {
  const parentSignal = parentController.signal;
  if (childSignal.aborted) {
    if (!parentSignal.aborted) {
      parentController.abort(childSignal.reason);
    }
  } else {
    const parentAbortHandler = () => {
      parentSignal.removeEventListener("abort", parentAbortHandler);
      childSignal.removeEventListener("abort", childAbortHandler);
    };
    const childAbortHandler = () => {
      parentSignal.removeEventListener("abort", parentAbortHandler);
      childSignal.removeEventListener("abort", childAbortHandler);

      if (!parentSignal.aborted) {
        parentController.abort(childSignal.reason);
      }
    };
    parentSignal.addEventListener("abort", parentAbortHandler);
    childSignal.addEventListener("abort", childAbortHandler);
  }
}
