/// <reference lib="webworker" />
import { prepare, transferables } from "./prepare";

declare const self: DedicatedWorkerGlobalScope;

self.onmessage = (e: MessageEvent<ArrayBuffer>) => {
  const out = prepare(e.data);
  self.postMessage(out, transferables(out));
};
