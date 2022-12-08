import * as R from "ramda";
import { data } from "./input";

const treeDistances = (trees: number[], idx: number): [number, number] => {
  const tree = trees[idx];
  let leftTrees = idx;
  let rightTrees = trees.length - idx - 1;
  for (const i of R.range(idx + 1, trees.length)) {
    if (trees[i] >= tree) {
      rightTrees = i - idx;
      break;
    }
  }
  for (const i of R.range(0, idx)) {
    if (trees[idx - (i + 1)] >= tree) {
      leftTrees = i + 1;
      break;
    }
  }
  return [leftTrees, rightTrees];
};

const isLowPoint = (trees: number[], idx: number): boolean => {
  const tree = trees[idx];
  let foundLeft = false;
  let foundRight = false;
  for (const i of R.range(idx + 1, trees.length)) {
    if (trees[i] >= tree) {
      foundRight = true;
      break;
    }
  }
  if (!foundRight) return false;
  for (const i of R.range(0, idx)) {
    if (trees[idx - (i + 1)] >= tree) {
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
  let total = 0;
  const forestT = R.transpose(forest);
  for (const i of R.range(0, forest.length)) {
    const trees = forest[i];
    for (const j of R.range(0, trees.length)) {
      if (!(isLowPoint(trees, j) && isLowPoint(forestT[j], i))) {
        total += 1;
      }
    }
  }
  return total;
};

const part2 = (forest: number[][]): number => {
  let best = 0;
  const forestT = R.transpose(forest);
  for (const i of R.range(0, forest.length)) {
    const trees = forest[i];
    for (const j of R.range(0, trees.length)) {
      const score = R.reduce(
        R.multiply,
        1,
        R.concat(treeDistances(trees, j), treeDistances(forestT[j], i))
      );
      if (score > best) {
        best = score;
      }
    }
  }
  return best;
};

describe("day 8", () => {
  it("can parse", () => {
    expect(parse(" 12\n  45")).toStrictEqual([
      [1, 2],
      [4, 5],
    ]);
  });

  it.each([
    [[2, 1, 2], 1],
    [[2, 2, 2], 1],
    [[2, 1, 1, 2], 2],
    [[2, 1, 3, 1, 2], 2],
    [[2, 1, 2, 1, 2], 3],
    [[2, 1, 3, 2, 3, 1, 2], 3],
  ])(
    "can find the number of low items in a line",
    (input: number[], count: number) => {
      expect(countLowRow(input)).toBe(count);
    }
  );

  it.each([
    [[2, 1, 3, 2, 3, 1, 2], 0, [0, 2]],
    [[2, 1, 3, 2, 3, 1, 2], 1, [1, 1]],
    [[2, 1, 3, 2, 3, 1, 2], 2, [2, 2]],
    [[2, 1, 3, 2, 3, 1, 2], 3, [1, 1]],
    [[2, 1, 3, 2, 3, 1, 2], 4, [2, 2]],
    [[2, 1, 3, 2, 3, 1, 2], 5, [1, 1]],
    [[2, 1, 3, 2, 3, 1, 2], 6, [2, 0]],
  ])(
    "can measure tree distances in %s at %s",
    (trees: number[], idx: number, result: [number, number]) => {
      expect(treeDistances(trees, idx)).toStrictEqual(result);
    }
  );

  const testData = `30373
    25512
    65332
    33549
    35390`;

  describe("part 1", () => {
    it("can do the sample", () => {
      expect(part1(parse(testData))).toBe(21);
    });
    it("has the answer", () => {
      expect(part1(parse(data))).toBe(1803);
    });
  });
  describe("part 2", () => {
    it("can do the sample", () => {
      expect(part2(parse(testData))).toBe(8);
    });
    it("has the answer", () => {
      expect(part2(parse(data))).toBe(-1);
    });
  });
});
