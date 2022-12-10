import * as R from "ramda";

import { data } from "./input";

const allDifferent = (input: string): boolean => {
  return input.length == R.uniq(Array.from(input)).length;
};

const slidingWindowUniqueness = (input: string, windowSize: number) => {
  for (const i of R.range(0, input.length - windowSize)) {
    const slice = input.slice(i, i + windowSize);
    const found = allDifferent(slice);
    if (found) {
      return i + windowSize;
    }
  }
  return -1;
}

const startOfPacket = (input: string): number => {
  return slidingWindowUniqueness(input, 4)
};

const startOfMessage = (input: string): number => {
  return slidingWindowUniqueness(input, 14)
}

const part1 = startOfPacket;

const part2 = startOfMessage;

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

  describe("part 2", () => {
    it("can solve the samples", () => {
      expect(part2("mjqjpqmgbljsphdztnvjfqwrcgsmlb")).toBe(19);
      expect(part2("bvwbjplbgvbhsrlpgdmjqwftvncz")).toBe(23);
      expect(part2("nppdvjthqldpwncqszvftbrmjlhg")).toBe(23);
      expect(part2("nznrnfrfntjfmvfwmzdfjlvtqnbhcprsg")).toBe(29);
      expect(part2("zcfzfwzzqfrljwzlrfnpqdbhtmscgvjw")).toBe(26);
    });

    it("solved part 2", () => {
      expect(part2(data)).toBe(2508);
    });
  });
});
