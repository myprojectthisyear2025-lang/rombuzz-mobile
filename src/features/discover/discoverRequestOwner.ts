export function createDiscoverRequestOwner(isActive: () => boolean) {
  let flight: { key: string; controller: AbortController; promise: Promise<void> } | null = null;
  return {
    isRunning: () => !!flight,
    cancel() { flight?.controller.abort(); flight = null; },
    run(key: string, work: (signal: AbortSignal, valid: () => boolean) => Promise<void>) {
      if (!isActive()) return Promise.resolve();
      if (flight?.key === key) return flight.promise;
      flight?.controller.abort();
      const controller = new AbortController();
      const valid = () => !controller.signal.aborted && flight?.controller === controller && isActive();
      const promise = Promise.resolve().then(() => valid() ? work(controller.signal, valid) : undefined).finally(() => {
        if (flight?.controller === controller) flight = null;
      });
      flight = { key, controller, promise };
      return promise;
    },
  };
}

export function discoverTimeout<T>(task: Promise<T>, milliseconds: number, fallback: T, signal?: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout>;
    const cleanup = () => { clearTimeout(timer); signal?.removeEventListener("abort", cancel); };
    const cancel = () => { cleanup(); resolve(fallback); };
    if (signal?.aborted) { void task.catch(() => {}); resolve(fallback); return; }
    timer = setTimeout(cancel, milliseconds);
    signal?.addEventListener("abort", cancel, { once: true });
    task.then(value => { cleanup(); resolve(value); }, error => { cleanup(); reject(error); });
  });
}
