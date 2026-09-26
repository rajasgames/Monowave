import { ok, err, isOk, isErr } from "../../../src/core/result";

describe("Result utility", () => {
  it("handles ok result correctly", () => {
    const res = ok(42);
    expect(isOk(res)).toBe(true);
    expect(isErr(res)).toBe(false);
    if (isOk(res)) {
      expect(res.value).toBe(42);
    }
  });

  it("handles error result correctly", () => {
    const res = err("failed");
    expect(isOk(res)).toBe(false);
    expect(isErr(res)).toBe(true);
    if (isErr(res)) {
      expect(res.error).toBe("failed");
    }
  });
});
