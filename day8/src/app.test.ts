import * as R from "ramda";
import { data } from "./input";

const isLowPoint = (trees: number[], idx: number): boolean => {
  const tree = trees[idx];
  let foundLeft = false;
  let foundRight = false;
  for (const i of R.range(idx+1, trees.length)) {
    if (trees[i] >= tree) {
      foundRight = true;
      break;
    }
  }
  if (!foundRight) return false;
  for (const i of R.range(0, idx)) {
    if (trees[idx - (i+1)] >= tree) {
      foundLeft = true;
      break;
    }
  }
  return foundLeft && foundRight;
};

const countLowRow = (trees: number[]): number => {
  return R.sum(
    R.range(0, trees.length)
      .map(R.partial(isLowPoint, [trees]))
      .map((b) => (b && 1) || 0)
  );
};

const parse = (text: string) => {
  return text.split("\n").map((line) =>
    line
      .trim()
      .split("")
      .map((s) => parseInt(s))
  );
};

const part1 = (forest: number[][]): number => {
  let total = 0
  const forestT = R.transpose(forest);
  for (const i of R.range(0, forest.length)) {
    const trees = forest[i];
    for (const j of R.range(0, trees.length)) {
      if (!(isLowPoint(trees, j) && isLowPoint(forestT[j], i))) {
        total += 1
      }
    }
  }
  return total
}

describe("day 8", () => {
  it("can parse", () => {
    expect(parse(" 12\n  45")).toStrictEqual([
      [1, 2],
      [4, 5],
    ]);
  });

  it("can find the number of low items in a line", () => {
    expect(countLowRow([2, 1, 2])).toBe(1);
    expect(countLowRow([2, 2, 2])).toBe(1);
    expect(countLowRow([2, 1, 1, 2])).toBe(2);
    expect(countLowRow([2, 1, 3, 1, 2])).toBe(2);
    expect(countLowRow([2, 1, 2, 1, 2])).toBe(3);
    expect(countLowRow([2, 1, 3, 2, 3, 1, 2])).toBe(3);
  });

  describe("part 1", () => {
    const testData = `30373
    25512
    65332
    33549
    35390`;
    it("can do the sample", () => {
      expect(part1(parse(testData))).toBe(21);
    });
    it("has the answer", () => {
      expect(part1(parse(data))).toBe(1803);
    });
  });
});
