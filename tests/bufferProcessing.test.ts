import test, { suite } from "node:test";
import * as assert from "node:assert";
import * as bufferUtils from "../src/channel/buffer";

suite("Should process text properly", () => {
  test("should split empty string", () => {
    assert.deepEqual(bufferUtils.smartSplitData(""), [""]);
  });

  test("should split single word string", () => {
    assert.deepEqual(bufferUtils.smartSplitData("hello"), ["hello"]);
  });

  test("should split simple text", () => {
    const simpleTestCases: [string, string[]][] = [
      ["a|b|c|d", ["a", "b", "c", "d"]],
      ["a|b", ["a", "b"]],
      ["1|123a", ["1", "123a"]],
    ];

    simpleTestCases.forEach((expected) => {
      const actual = bufferUtils.smartSplitData(expected[0]);

      assert.equal(actual.length, expected[1].length, "Length didnt match");
      assert.deepEqual(actual, expected[1], "Splitted segments didnt match");
    });
  });
});
