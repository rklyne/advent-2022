import * as R from "ramda";
import { data, data2, testData } from "./input";

type Point = [number, number];
type Range = [number, number]; // r, c
type Sensor = [Point, Point]; // sensor, beacon

const parse = (text: string): Sensor[] => {
  return text.split("\n").map((line) => {
    const parts = line.split(/[=:,]/);
    return [
      [parseInt(parts[3]), parseInt(parts[1])],
      [parseInt(parts[7]), parseInt(parts[5])],
    ];
  });
};

const distance = (p1: Point, p2: Point): number => {
  return Math.abs(p1[0] - p2[0]) + Math.abs(p1[1] - p2[1]);
};

const inRangeOfRow = (row: number, sensor): Range|undefined => {
  const sensorDistance = distance(sensor[0], sensor[1]);
  const midColumn = sensor[0][1];
  const rowMidPoint: Point = [row, midColumn];
  const rowDistance = distance(sensor[0], rowMidPoint);
  if (sensorDistance < rowDistance) {
    return
  }
  const diff = rangeSize([sensorDistance, rowDistance]) - 1;
  const range: Range = [midColumn - diff, midColumn + diff];
  return range;
};

const rangeSize = (r: Range): number => {
  return Math.abs(r[1] - r[0]) + 1;
};

const overlapRange = (left: Range, right: Range): Range | undefined => {
  if (left[0] > left[1]) throw new Error(`left oops ${left}`);
  if (right[0] > right[1]) throw "right oops";
  if (left[0] > right[1]) return;
  if (right[0] > left[1]) return;
  const places = R.sortBy(R.identity, [...left, ...right]);
  const overlap: Range = [places[1], places[2]];
  if (overlap[0] > overlap[1])
    throw new Error(
      `overlap oops, ${JSON.stringify({
        overlap,
        places,
        left,
        right,
        s: places.sort(),
      })}`
    );
  return overlap;
};

const overlapSize = (r1: Range, r2: Range): number => {
  const overlap = overlapRange(r1, r2);
  if (!overlap) return 0;
  return rangeSize(overlap);
};

const rangeMinusL = (range: Range, other: Range): Range[] => {
  const result = rangeMinus(range, other);
  // console.log({range, other, result})
  return result
}
const rangeMinus = (range: Range, other: Range): Range[] => {
  const overlap = overlapRange(range, other);
  if (!overlap) return [range];
  if (overlap[0] == range[0]) {
    if (overlap[1] == range[1]) {
      return []
    } else {
      return [[overlap[1]+1, range[1]]]
    }
  } else {
    if (overlap[1] == range[1]) {
      return [[range[0], overlap[0]-1]]
    } else {
      return [
        [range[0], overlap[0]-1],
        [overlap[1]+1, range[1]]
      ]
    }
  }
  return [];
};

const rangeTotal = (ranges: Range[]): number => {
  const rangesToAdd: Range[] = [];
  for (const range of ranges) {
    let newRanges = [range];
    for (const addingRange of rangesToAdd) {
      newRanges = R.reduce(
        (a, b) => a.concat(b),
        [] as Range[],
        newRanges.map((r) => rangeMinusL(r, addingRange))
      );
    }
    newRanges.forEach((r) => rangesToAdd.push(r));
  }
  // console.log({ranges: ranges.length, toAdd: rangesToAdd.length, ranges, rangesToAdd})
  return (
    R.sum(rangesToAdd.map(rangeSize))
  );
};

const numberInRange = (n: number, range: Range): boolean => {
  if (range[0] > range[1]) throw "num in range oops";
  return n >= range[0] && n <= range[1];
};

const beaconsInRanges = (
  sensors: Sensor[],
  ranges: Range[],
  row: number
): number => {
  const beacons: Point[] = R.uniq(sensors.map((s) => s[1]));
  let total = 0;
  for (const beacon of beacons) {
    if (beacon[0] != row) continue;
    for (const range of ranges) {
      if (numberInRange(beacon[1], range)) {
        total += 1;
        break;
      }
    }
  }
  return total;
};

const part1 = (sensors: Sensor[], row): number => {
  const ranges = sensors.map(R.partial(inRangeOfRow, [row])).filter(R.identity);
  const range = rangeTotal(ranges);
  console.log({ranges, range})
  const beacons = beaconsInRanges(sensors, ranges, row);
  return range - beacons;
};

describe("day 15", () => {
  it("parses", () => {
    expect(parse(data)[0]).toStrictEqual([
      [496787, 1112863],
      [2000000, 1020600],
    ]);
  });

  it("distances", () => {
    expect(distance([1, 2], [4, 4])).toBe(5);
  });

  it.each([
    [[1, 6], [4, 9], 3],
    [[1, 4], [6, 9], 0],
    [[1, 4], [2, 4], 3],
  ])("overlap", (left, right, count) => {
    expect(overlapSize(left as Range, right as Range)).toBe(count);
  });

  it("rangeTotal", () => {
    expect(
      rangeTotal([
        [1, 5],
        [4, 7],
        [3, 8],
        [10, 10],
      ])
    ).toBe(9);
    expect(
      rangeTotal([
        [1, 5],
        [4, 7],
        [3, 8],
        [10, 10],
        [2, 6],
        [12,13]
      ])
    ).toBe(11);
  });

  it("in range", () => {
    expect(
      inRangeOfRow(1, [
        [7, 8],
        [10, 2],
      ])
    ).toStrictEqual([5, 11]);
    expect(
      inRangeOfRow(1, [
        [5, 10],
        [10, 15],
      ])
    ).toStrictEqual([4, 16]);
    expect(
      inRangeOfRow(-5, [
        [5, 10],
        [10, 15],
      ])
    ).toStrictEqual([10, 10]);
  });

  describe("part 1", () => {
    it("sample", () => {
      expect(part1(parse(testData), 10)).toBe(26);
    });
    it("sample2", () => {
      expect(part1(parse(data2), 2_000_000)).toBe(4879972);
    });
    it("answer", () => {
      expect(part1(parse(data), 2_000_000)).toBe(-1);
      // not 6712745
      // not 6712744
    });
  });
});
