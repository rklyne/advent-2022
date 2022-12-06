import * as R from "ramda";

import { data } from "./input";

const allDifferent = (input: string): boolean => {
  return input.length == R.uniq(Array.from(input)).length;
};

const part1 = (input: string): number => {
  for (const i of R.range(0, input.length - 4)) {
    const slice = input.slice(i, i + 4);
    const found = allDifferent(slice);
    if (found) {
      return i + 4;
    }
  }
  return -1;
};

describe("day 6", () => {
  it("knows when 4 characters are different", () => {
    expect(allDifferent("abcd")).toBe(true);

    expect(allDifferent("aacd")).toBe(false);
    expect(allDifferent("abad")).toBe(false);
    expect(allDifferent("abca")).toBe(false);
  });

  describe("part 1", () => {
    it("can solve the samples", () => {
      expect(part1("bvwbjplbgvbhsrlpgdmjqwftvncz")).toBe(5);
      expect(part1("nppdvjthqldpwncqszvftbrmjlhg")).toBe(6);
      expect(part1("nznrnfrfntjfmvfwmzdfjlvtqnbhcprsg")).toBe(10);
      expect(part1("zcfzfwzzqfrljwzlrfnpqdbhtmscgvjw")).toBe(11);
    });

    it("solved part 1", () => {
      expect(part1(data)).toBe(1804);
    });
  });
});
