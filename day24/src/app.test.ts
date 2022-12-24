import * as R from "ramda";
import Heap from "heap";

import { data, testData } from "./input";

type Coord = [number, number]; // row, col == y, x
type Direction = ">" | "<" | "v" | "^";
type Cell = "#" | "." | Direction;
type Input = Cell[][]; // row, col == y, x

const isDirection = (s: string): s is Direction => {
  return "<>v^".includes(s);
};

const isCell = (s: string): s is Cell => {
  return ".#".includes(s) || isDirection(s);
};

const parse = (text: string): Input => {
  return text
    .trim()
    .split("\n")
    .map((line) => line.trim().split("").filter(isCell));
};

type SingleBlizzard = [Coord, Direction];
class Blizzard {
  private blizzards: Record<number, SingleBlizzard[]>;

  constructor(private input: Input) {
    this.blizzards = {
      0: [],
    };
    input.forEach((row, rowIdx) => {
      row.forEach((cell, colIdx) => {
        if (isDirection(cell)) {
          this.blizzards[0].push([[rowIdx, colIdx], cell]);
        }
      });
    });
  }

  get maxCol(): number {
    return this.input[0].length;
  }

  get maxRow(): number {
    return this.input.length;
  }

  private getBlizzard(m: number): SingleBlizzard[] {
    if (m < 0) throw "oops minute";
    if (!(m in this.blizzards)) {
      this.blizzards[m] = this.getBlizzard(m - 1).map((blizz) =>
        this.move(blizz)
      );
    }
    return this.blizzards[m];
  }

  public minute(m: number): Coord[] {
    const current = this.getBlizzard(m);
    if (!current) throw new Error("oops current");
    return current.map(([coord, dir]) => coord);
  }

  private wrap(coord: Coord): Coord {
    return wrap(coord, this.maxRow, this.maxCol);
  }

  private move(src: SingleBlizzard): SingleBlizzard {
    const [pos, dir] = src;
    // pos = [row, col] = [y, x]
    const moved = doMove(pos, dir);
    return [this.wrap(moved), dir];
  }
}

const doMove = (pos: Coord, dir: Direction): Coord => {
  if (dir == ">") return [pos[0], pos[1] + 1];
  if (dir == "<") return [pos[0], pos[1] - 1];
  if (dir == "^") return [pos[0] - 1, pos[1]];
  if (dir == "v") return [pos[0] + 1, pos[1]];
  throw "oops no move";
};
const wrap = (coord: Coord, maxRow: number, maxCol: number): Coord => {
  const [row, col] = coord;

  // min 1, max (maxRow-1 - 1)
  return [
    ((row + maxRow - 3) % (maxRow - 2)) + 1,
    ((col + maxCol - 3) % (maxCol - 2)) + 1,
  ];
};
const manhattan = (c1: Coord, c2: Coord): number => {
  return Math.abs(c1[0] - c2[0]) + Math.abs(c1[1] - c2[1]);
};

const findPath = (start: Coord, end: Coord, blizzards: Blizzard): number => {
  type Node = [Coord, number]; // pos, minutes
  const costPrediction = (node: Node) => manhattan(node[0], end) + node[1];
  const heap = new Heap<Node>((l, r) => costPrediction(l) - costPrediction(r));
  heap.push([start, 0]);
  const directions: Direction[] = ["<", ">", "^", "v"]
  let limit = 10_000;
  while (heap.size()) {
    if (limit <= 0) throw "oops limit";
    limit--;
    const [coord, minutes] = heap.pop();
    if (R.equals(coord, end)) return minutes
    const newMinutes = minutes + 1;
    heap.push([coord, newMinutes]);
    for (const move of directions ) {
      heap.push([doMove(coord, move), newMinutes]);
    }
  }
  throw "oops no find";
};

const part1 = (input: Input) => {
  return 0;
};

const part2 = (input: Input) => {
  return 0;
};

describe("day X", () => {
  const smallExample = `
  #.#####
  #.....#
  #>....#
  #.....#
  #...v.#
  #.....#
  #####.#
  `;

  describe("blizzard", () => {
    it("minute 1", () => {
      const blizzard = new Blizzard(parse(smallExample));
      expect(blizzard.minute(1)).toStrictEqual([
        [2, 2],
        [5, 4],
      ]);
    });

    it("wraps", () => {
      const blizzard = new Blizzard(parse(smallExample));
      expect(blizzard.minute(2)).toStrictEqual([
        [2, 3],
        [1, 4],
      ]);
    });

    it("loops", () => {
      const blizzard = new Blizzard(parse(smallExample));
      expect(blizzard.minute(5)).toStrictEqual([
        [2, 1],
        [4, 4],
      ]);
    });
  });

  describe("pathfinding", () => {
    it("just walks when no blizzards", () => {
      const blizzards = new Blizzard([]);
      const distance = findPath([0, 1], [6, 5], blizzards);
      expect(distance).toBe(10);
    });
  });

  describe.skip("part 1", () => {
    it("sample", () => {
      expect(part1(parse(testData))).toBe(18);
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
