import type { Prepared } from "./prepare";

/** Runs prepare() off the main thread; falls back to the main thread if workers are unavailable. */
export async function prepareAsync(headData: ArrayBuffer, signal: AbortSignal): Promise<Prepared> {
  if (typeof Worker !== "undefined") {
    try {
      return await new Promise<Prepared>((resolve, reject) => {
        const worker = new Worker(new URL("./prepare.worker.ts", import.meta.url), {
          type: "module",
        });
        const stop = () => worker.terminate();
        signal.addEventListener("abort", () => (stop(), reject(signal.reason)), { once: true });
        worker.onmessage = (e: MessageEvent<Prepared>) => (stop(), resolve(e.data));
        worker.onerror = (e) => (stop(), reject(new Error(e.message)));
        worker.postMessage(headData, [headData]);
      });
    } catch (err) {
      if (signal.aborted) throw err;
      // Fall through: the buffer was transferred, so the caller must not reuse it; refetch below.
      console.warn("Particle worker failed, preparing on the main thread", err);
      const { loadHead } = await import("./data");
      headData = await loadHead(signal);
    }
  }
  const { prepare } = await import("./prepare");
  return prepare(headData);
}
