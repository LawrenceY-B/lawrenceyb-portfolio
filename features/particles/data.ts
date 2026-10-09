/** Head point cloud: Int16 xyz (quantised to HEAD_SCALE) then Uint8 brightness, HEAD_POINTS each. */
export const DATA_URL = "/shapes.bin";
export const HEAD_POINTS = 50000;
export const HEAD_SCALE = 1.200693;

export async function loadHead(signal?: AbortSignal): Promise<ArrayBuffer> {
  const res = await fetch(DATA_URL, { signal });
  if (!res.ok) throw new Error(`${DATA_URL}: HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  if (buf.byteLength < HEAD_POINTS * 7) throw new Error(`${DATA_URL}: truncated`);
  return buf;
}
