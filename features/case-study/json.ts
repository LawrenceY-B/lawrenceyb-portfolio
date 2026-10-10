export type JsonToken = {
  kind: "key" | "string" | "number" | "literal" | "punct" | "space";
  text: string;
};

const TOKEN =
  /("(?:\\.|[^"\\])*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false|null)\b|([{}[\],:])|(\s+)/g;

/** Pretty-prints a value and splits it into tokens for syntax highlighting. */
export function tokenizeJson(value: unknown): JsonToken[] {
  const src = JSON.stringify(value, null, 2) ?? "";
  const out: JsonToken[] = [];
  for (const m of src.matchAll(TOKEN)) {
    const [, str, colon, num, lit, punct, space] = m;
    if (str !== undefined) {
      out.push({ kind: colon ? "key" : "string", text: str });
      if (colon) out.push({ kind: "punct", text: colon });
    } else if (num !== undefined) out.push({ kind: "number", text: num });
    else if (lit !== undefined) out.push({ kind: "literal", text: lit });
    else if (punct !== undefined) out.push({ kind: "punct", text: punct });
    else if (space !== undefined) out.push({ kind: "space", text: space });
  }
  return out;
}
