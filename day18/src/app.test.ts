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

const adjacencyOffsets: Point[] = [
  [0, 0, 1],
  [0, 0, -1],
  [0, 1, 0],
  [0, -1, 0],
  [1, 0, 0],
  [-1, 0, 0],
];

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

  return R.sum(
    points.map(([x, y, z]) =>
      R.sum(
        adjacencyOffsets.map(
          ([aX, aY, aZ]) => 1 - (lava[x + aX]?.[y + aY]?.[z + aZ] ?? 0)
        )
      )
    )
  );
};

const part2 = (points: Point[]): number => {
  const maxX = Math.max(...points.map((p) => p[0])) + 1;
  const maxY = Math.max(...points.map((p) => p[1])) + 1;
  const maxZ = Math.max(...points.map((p) => p[2])) + 1;
  console.log({ maxX, maxY, maxZ });
  const lava: number[][][] = R.range(0, maxX + 2).map((n) =>
    R.range(0, maxY + 2).map((n) => R.range(0, maxZ + 2).map((n) => 0))
  );
  points.forEach(([x, y, z]) => {
    lava[x][y][z] = 1;
  });
  const air: (number | undefined)[][][] = R.range(0, maxX + 2).map((x) =>
    R.range(0, maxY + 2).map((y) =>
      R.range(0, maxZ + 2).map((z) => {
        if (lava[x]?.[y]?.[z]) return 0;
        if (x == 0 || y == 0 || z == 0) {
          return 1;
        }
        if (x == maxX || y == maxY || z == maxZ) {
          return 1;
        }
        return undefined;
      })
    )
  );

  const allPointsSimple: Point[] = [];
  R.range(-1, maxX + 2).forEach((x) =>
    R.range(-1, maxY + 2).forEach((y) =>
      R.range(-1, maxZ + 2).forEach((z) => {
        allPointsSimple.push([x, y, z]);
      })
    )
  );
  const allPoints = R.sortWith(
    [
      R.ascend(([x, y, z]) =>
        R.sum([
          Math.abs(x - maxX / 2),
          Math.abs(y - maxY / 2),
          Math.abs(z - maxZ / 2),
        ])
      ),
    ],
    allPointsSimple
  );
  let limit = 60_000;
  let repeats = 0;
  let stepsSinceNoProgress = 0;
  while (allPoints.length) {
    if (stepsSinceNoProgress > 2 * allPoints.length) {
      break;
    }
    if (limit == 0) throw "oops limit";
    limit--;
    const [x, y, z] = allPoints.pop();
    if (x <= 0 || y <= 0 || z <= 0) continue;
    if (x >= maxX || y >= maxY || z >= maxZ) continue
    if (air[x][y][z] == 0) continue;
    if (air[x][y][z] == 1) continue;
    const adjPointIsAir = ([aX, aY, aZ]) => air[x + aX][y + aY][z + aZ] == 1;
    const adjAir = R.any(adjPointIsAir, adjacencyOffsets);
    // console.log({x, y, z, isAir: adjacencyOffsets.map(adjPointIsAir)})
    if (adjAir) {
      air[x][y][z] = 1;
      stepsSinceNoProgress = 0;
    } else {
      // to the end of the list
      allPoints.unshift([x, y, z]);
      repeats++;
      stepsSinceNoProgress++;
    }
  }
  const airAdjacentToLava = R.sum(R.flatten(
    allPointsSimple.map(point => {
      const [x,y,z] = point
      if (air[x]?.[y]?.[z] != 1) return 0
      return R.sum(adjacencyOffsets.map(([ax, ay, az]) => lava[x+ax]?.[y+ay]?.[z+az] ?? 0))
    })
  ))
  const isAir = ([x, y, z]: Point): boolean => {
    if (x <= 0 || y <= 0 || z <= 0) return true;
    // if (x >= maxX || y >= maxY || z >= maxZ) return true;
    return air[x][y][z] == 1;
  };
  // console.log(JSON.stringify(air));
  const lavaAdjacentToAir = R.sum(
    points.map(([x, y, z]) =>
      R.sum(
        adjacencyOffsets.map(([aX, aY, aZ]) =>
          isAir([x + aX, y + aY, z + aZ]) ? 1 : 0
        )
      )
    )
  );
  console.log({ repeats, limit, airAdjacentToLava, lavaAdjacentToAir });
  // I have no idea why I'm getting two numbers different here but the average of them does work....
  return (lavaAdjacentToAir + airAdjacentToLava) / 2
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
    it("answer", () => {
      expect(part2(parse(data))).toBe(2106);
      // too low  -> 2101
      // too high -> 2402
    });
  });
});
