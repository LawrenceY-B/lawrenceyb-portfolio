import { describe, expect, it } from "vitest";

import { tokenizeJson } from "@/features/case-study/json";

describe("tokenizeJson", () => {
  it("labels keys, strings, numbers and literals", () => {
    const kinds = tokenizeJson({ a: "x", b: -1.5, c: true, d: null })
      .filter((t) => t.kind !== "space" && t.kind !== "punct")
      .map((t) => `${t.kind}:${t.text}`);
    expect(kinds).toEqual([
      'key:"a"',
      'string:"x"',
      'key:"b"',
      "number:-1.5",
      'key:"c"',
      "literal:true",
      'key:"d"',
      "literal:null",
    ]);
  });
  it("round-trips to the pretty-printed JSON", () => {
    const value = { s: 'quote " and : colon', list: [1, { n: "GH¢" }] };
    expect(
      tokenizeJson(value)
        .map((t) => t.text)
        .join(""),
    ).toBe(JSON.stringify(value, null, 2));
  });
});
