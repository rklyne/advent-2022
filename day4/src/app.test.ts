import * as R from "ramda";
import { pairList, parse } from "./input";

type Range = [number, number];
type Input = [Range, Range][];

const rangeContainsOther = (range: Range, other: Range) => {
  return range[0] <= other[0] && range[1] >= other[1];
};

const oneContainsOther = (range1: Range, range2: Range): boolean => {
  const result = (
    rangeContainsOther(range1, range2) || rangeContainsOther(range2, range1)
  );
  // console.log({range1, range2, result})
  return result
};

const rangesHaveAnyOverlap = (range1: Range, range2: Range): boolean => {
  return R.intersection(R.range(range1[0], range1[1]+1), R.range(range2[0], range2[1]+1)).length != 0
}

const part1 = (input: Input): number => {
  return input.filter(([range1, range2]) => {
    return oneContainsOther(range1, range2);
  }).length;
};

const part2 = (input: Input): number => {
  return input.filter(([range1, range2]) => {
    return rangesHaveAnyOverlap(range1, range2);
  }).length;
};

describe("day 4", () => {
  it("parsed the input right", () => {
    expect(pairList[0]).toStrictEqual([
      [30, 31],
      [2, 31],
    ]);
  });

  const testData = parse(`2-4,6-8
    2-3,4-5
    5-7,7-9
    2-8,3-7
    6-6,4-6
    2-6,4-8`) as Input;

  it("knows if a range contains another", () => {
    expect(rangeContainsOther([1, 1], [1, 1])).toBeTruthy();
    expect(rangeContainsOther([0, 2], [1, 1])).toBeTruthy();
    expect(rangeContainsOther([0, 2], [1, 2])).toBeTruthy();

    expect(rangeContainsOther([0, 2], [1, 3])).toBeFalsy();
    expect(rangeContainsOther([1, 1], [0, 0])).toBeFalsy();
    expect(rangeContainsOther([1, 1], [2, 2])).toBeFalsy();
  });

  it("knows if tere's any overlap", () => {
    expect(rangesHaveAnyOverlap([1, 1], [1, 1])).toBeTruthy();
    expect(rangesHaveAnyOverlap([0, 2], [1, 1])).toBeTruthy();
    expect(rangesHaveAnyOverlap([0, 2], [1, 2])).toBeTruthy();
    expect(rangesHaveAnyOverlap([0, 2], [1, 3])).toBeTruthy();

    expect(rangesHaveAnyOverlap([1, 1], [0, 0])).toBeFalsy();
    expect(rangesHaveAnyOverlap([1, 1], [2, 2])).toBeFalsy();
  });

  describe("part 1", () => {
    it("can do the test sample", () => {
      expect(part1(testData)).toBe(2);
    });
    it("has the answer", () => {
      expect(part1(pairList as Input)).toBe(444);
    });
  });

  describe("part 2", () => {
    it("can do the test sample", () => {
      expect(part2(testData)).toBe(4);
    });
    it("has the answer", () => {
      expect(part2(pairList as Input)).toBe(801);
    });
  });
});
