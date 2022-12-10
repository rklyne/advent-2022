import { rucksackTexts } from "./input";
import * as R from "ramda";

const charValue = (c: string): number => {
  const code = c.charCodeAt(0);
  if (code > 90) {
    return code - 96;
  }
  return code - 38;
};

type Input = string[];
type Compartment = string;
type Rucksack = [Compartment, Compartment];
const parseRucksack = (text: string): Rucksack => {
  const half = text.length / 2;
  return [text.slice(0, half), text.slice(half)];
};

const uniqueItems = (rucksack: Rucksack) => {
  return R.intersection(Array.from(rucksack[0]), Array.from(rucksack[1]));
};

const uniqueAmongRucksacks = (rucksacks: string[]) => {
  const charArrays: string[][] = rucksacks.map((s) => s.split(""));
  return R.reduce(R.intersection, charArrays[0], charArrays);
};

const part1 = (input: Input): number => {
  return R.sum(
    input.map(parseRucksack).map(uniqueItems).map(R.head).map(charValue)
  );
};

const part2 = (input: Input): number => {
  return R.sum(
    R.splitEvery(3, input).map(uniqueAmongRucksacks).map(R.head).map(charValue)
  );
};

describe("day 3", () => {
  const testInput: Input = [
    "vJrwpWtwJgWrhcsFMMfFFhFp",
    "jqHRNqRjqzjGDLGLrsFMfFZSrLrFZsSL",
    "PmmdzqPrVvPwwTWBwg",
    "wMqvLMZHhHMvwLHjbvcjnnSBnvTQFn",
    "ttgJtRGJQctTZtZT",
    "CrZsJsPPZsGzwwsLwLmpwMDw",
  ];
  it("can convert chars to values", () => {
    expect(charValue("p")).toBe(16);
    expect(charValue("P")).toBe(42);
    expect(charValue("v")).toBe(22);
    expect(charValue("L")).toBe(38);
  });

  it("can find unique items (characters)", () => {
    expect(parseRucksack("acbd")).toStrictEqual(["ac", "bd"]);
    expect(uniqueItems(parseRucksack("abcade"))).toStrictEqual(["a"]);
  });

  describe("part 1", () => {
    it("can solve the test exmaple", () => {
      expect(part1(testInput)).toBe(157);
    });
    it("knows the answer", () => {
      expect(part1(rucksackTexts)).toBe(7908);
    });
  });
  describe("part 2", () => {
    it("can solve the test exmaple", () => {
      expect(part2(testInput)).toBe(70);
    });
    it("knows the answer", () => {
      expect(part2(rucksackTexts)).toBe(2838);
    });
  });
});
