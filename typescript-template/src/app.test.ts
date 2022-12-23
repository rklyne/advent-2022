import * as R from "ramda";

import { data, testData } from "./input";

type Input = any;

const parse = (text: string): Input => {};

const part1 = (input: Input) => {
  return 0;
};

const part2 = (input: Input) => {
  return 0;
};

describe("day X", () => {
  it("fails", () => {
    expect(false).toBe(true);
  });

  describe.skip("part 1", () => {
    it("sample", () => {
      expect(part1(parse(testData))).toBe(-1);
    });

    it.skip("answer", () => {
      expect(part1(parse(data))).toBe(-1);
    });
  });

  describe.skip("part 2", () => {
    it("sample", () => {
      expect(part2(parse(testData))).toBe(-1);
    });

    it.skip("answer", () => {
      expect(part2(parse(data))).toBe(-1);
    });
  });
});
