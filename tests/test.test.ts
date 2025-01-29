import assert from "node:assert";
import { test, suite } from "node:test";

suite("Test", () => {
  test("basic math", () => {
    assert.equal(2 + 2, 4);
  });
});
