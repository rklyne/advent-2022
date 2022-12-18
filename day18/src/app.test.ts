import * as R from "ramda";
import { data, testData } from "./input";

type Point = [number, number, number];

const toStr = (s) => parseInt(s);
const parse = (text: string): Point[] => {
  return text.split("\n").map((line) => {
    const parts = line.split(",");
    return [toStr(parts[0]), toStr(parts[1]), toStr(parts[2])];
  });
};

const part1 = (points: Point[]): number => {
  const maxX = Math.max(...points.map((p) => p[0]));
  const maxY = Math.max(...points.map((p) => p[1]));
  const maxZ = Math.max(...points.map((p) => p[2]));
  console.log({ maxX, maxY, maxZ });
  const lava: number[][][] = R.range(0, maxX + 1).map((n) =>
    R.range(0, maxY + 1).map((n) => R.range(0, maxZ + 1).map((n) => 0))
  );
  points.forEach(([x, y, z]) => {
    lava[x][y][z] = 1;
  });

  const adjacencyOffsets: Point[] = [
    [0, 0, 1],
    [0, 0, -1],
    [0, 1, 0],
    [0, -1, 0],
    [1, 0, 0],
    [-1, 0, 0],
  ];
  const surfaces: number[][][] = R.range(0, maxX + 1).map((x) =>
    R.range(0, maxY + 1).map((y) =>
      R.range(0, maxZ + 1).map((z) => {
        const adjSum = R.sum(
          adjacencyOffsets.map(
            ([aX, aY, aZ]) => 1 - (lava[x + aX]?.[y + aY]?.[z + aZ] ?? 0)
          )
        );
        if (!lava[x][y][z]) return 0;
        return adjSum;
      })
    )
  );
  return R.sum(R.flatten(surfaces));
};

const part2 = (points: Point[]): number => {
  const maxX = Math.max(...points.map((p) => p[0]));
  const maxY = Math.max(...points.map((p) => p[1]));
  const maxZ = Math.max(...points.map((p) => p[2]));
  console.log({ maxX, maxY, maxZ });
  const lava: number[][][] = R.range(0, maxX + 1).map((n) =>
    R.range(0, maxY + 1).map((n) => R.range(0, maxZ + 1).map((n) => 0))
  );
  const air: number[][][] = R.range(0, maxX + 1).map((n) =>
    R.range(0, maxY + 1).map((n) => R.range(0, maxZ + 1).map((n) => 0))
  );
  points.forEach(([x, y, z]) => {
    lava[x][y][z] = 1;
  });

  const adjacencyOffsets: Point[] = [
    [0, 0, 1],
    [0, 0, -1],
    [0, 1, 0],
    [0, -1, 0],
    [1, 0, 0],
    [-1, 0, 0],
  ];
  const allPointsSimple: Point[] = [];
  R.range(0, maxX + 1).forEach((x) =>
    R.range(0, maxY + 1).forEach((y) =>
      R.range(0, maxZ + 1).forEach((z) => {
        allPoints.push([x, y, z]);
      })
    )
  );
  const allPoints = R.sortWith(
    [
      R.ascend(([x, y, z]) =>
        R.sum([x - maxX / 2, y - maxY / 2, z - maxZ / 2])
      ),
    ],
    allPointsSimple
  );
  const surfaces: number[][][] = [];
  while (allPoints) {
    const [x, y, z] = allPoints.pop();
    const adjSum = R.sum(
      adjacencyOffsets.map(([aX, aY, aZ]) => 1 - lava[x + aX][y + aY][z + aZ])
    );
    if (!lava[x][y][z]) return 0;
    return adjSum;
  }
  return R.sum(R.flatten(surfaces));
};

describe("day 18", () => {
  it("parses", () => {
    expect(parse(testData)[0]).toStrictEqual([2, 2, 2]);
  });

  describe("part 1", () => {
    it("sample", () => {
      expect(part1(parse(testData))).toBe(64);
    });
    it("answer", () => {
      expect(part1(parse(data))).toBe(3564);
    });
  });

  describe("part 2", () => {
    it("sample", () => {
      expect(part2(parse(testData))).toBe(58);
    });
    it.skip("answer", () => {
      expect(part2(parse(data))).toBe(-1);
    });
  });
});
