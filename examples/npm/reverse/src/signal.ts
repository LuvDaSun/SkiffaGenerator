export async function waitForSignal(...signals: NodeJS.Signals[]) {
  await new Promise<void>((resolve) => {
    const abort = () =>
      // remove listener needs to be performed in next tick to work properly
      setImmediate(() => {
        for (const signal of signals) {
          process.removeListener(signal, abort);
        }
        resolve();
      });
    for (const signal of signals) {
      process.addListener(signal, abort);
    }
  });
}
