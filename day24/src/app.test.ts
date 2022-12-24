import * as R from "ramda";
import Heap from "heap";

import { data, testData } from "./input";

type Coord = [number, number]; // row, col == y, x
type Board = [Coord, Coord];
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
  private blizzardSets: Set<string>;
  private blizzards: Record<number, SingleBlizzard[]>;

  constructor(private input: Input) {
    this.blizzards = {
      0: [],
    };
    this.blizzardSets = new Set();
    input.forEach((row, rowIdx) => {
      row.forEach((cell, colIdx) => {
        if (isDirection(cell)) {
          this.blizzards[0].push([[rowIdx, colIdx], cell]);
        }
      });
    });
  }

  get width(): number {
    return this.input[0].length;
  }

  get height(): number {
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

  private getBlizzardSet(minute: number): Set<string> {
    if (!(minute in this.blizzardSets)) {
      this.blizzardSets[minute] = new Set(
        this.minute(minute).map((coord) => coord.join(","))
      );
    }
    return this.blizzardSets[minute];
  }

  public occupiesAt(minute: number, pos: Coord): boolean {
    const blizSet = this.getBlizzardSet(minute);
    return blizSet.has(pos.join(","));
    const coords = this.minute(minute);
    return R.any((c) => c[0] == pos[0] && c[1] == pos[1], coords);
  }

  public minute(m: number): Coord[] {
    const current = this.getBlizzard(m);
    if (!current) throw new Error("oops current");
    return current.map(([coord, dir]) => coord);
  }

  private wrap(coord: Coord): Coord {
    return wrap(coord, this.height, this.width);
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

const wrap = (coord: Coord, height: number, width: number): Coord => {
  const [row, col] = coord;

  // min 1, max (maxRow-1 - 1)
  const maxR = height - 2
  const maxC = width - 2
  return [
    ((row + maxR - 1) % maxR) + 1,
    ((col + maxC - 1) % maxC) + 1,
  ];
};

const manhattan = (c1: Coord, c2: Coord): number => {
  return Math.abs(c1[0] - c2[0]) + Math.abs(c1[1] - c2[1]);
};

const coordsOnBoard = (
  pos: Coord,
  [leftTop, rightBottom]: [Coord, Coord]
): boolean => {
  if (pos[0] < leftTop[0]) return false;
  if (pos[1] < leftTop[1]) return false;
  if (pos[0] > rightBottom[0]) return false;
  if (pos[1] > rightBottom[1]) return false;
  return true;
};

const coordsEqual = (l: Coord, r: Coord): boolean => {
  return l[0] == r[0] && l[1] == r[1];
};

const pathAppend = (path, node) => {
  // return [];
  return [...path, node];
};

const findPath = (
  start: Coord,
  ends: Coord[],
  blizzards: Blizzard,
  board: [Coord, Coord]
): number => {
  type Node = [Coord, number, Coord[]]; // pos, minutes, path
  let end: Coord
  const nextEnd = () => {
    end = ends[0]
    ends = ends.slice(1)
  }
  nextEnd()
  const costPrediction = (node: Node) => manhattan(node[0], end) + node[1];
  const heap = new Heap<Node>((l, r) => costPrediction(l) - costPrediction(r));
  const startMinute = 0;
  heap.push([start, startMinute, [start]]);
  const directions: Direction[] = ["<", ">", "^", "v"];
  const MAX_LIMIT = 1_000_000;
  let steps = 0;
  const milestones = {};
  const seen = new Set<string>();
  const addToHeap = (node: Node) => {
    const id = [...node[0], node[1]].join(",")
    if (seen.has(id))
      return
    heap.push(node)
    seen.add(id)
  }
  while (heap.size()) {
    if (steps >= MAX_LIMIT) {
      // console.log({ loops: steps, remaining: heap.size(), milestones });
      throw "oops limit";
    }
    steps++;
    const node = heap.pop();
    const [coord, minutes, path] = node;
    if (!(minutes in milestones)) milestones[minutes] = steps;
    if (coordsEqual(coord, end)) {
      // console.log({ loops: steps, remaining: heap.size() });
      // console.log(node);
      if (ends.length) {
        start = end
        nextEnd();
        seen.clear();
        heap.clear();
      } else {
      return minutes;
      }
    }
    const newMinutes = minutes + 1;
    for (const dir of directions) {
      const move = doMove(coord, dir);
      if (!coordsEqual(move, end) && !coordsOnBoard(move, board)) continue;
      if (blizzards.occupiesAt(newMinutes, move)) continue;

      addToHeap([move, newMinutes, pathAppend(path, move)]);
    }
    if (!blizzards.occupiesAt(newMinutes, coord))
      addToHeap([coord, newMinutes, pathAppend(path, coord)]);
  }
  throw "oops no find";
};

const part1 = (input: Input) => {
  const board: Board = [
    [1, 1],
    [input.length - 2, input[0].length - 2],
  ];
  const start: Coord = [0, 1];
  const end: Coord = doMove(board[1], "v");
  const blizzards = new Blizzard(input);
  // console.log({ start, end, board });
  return findPath(start, [end], blizzards, board);
};

const part2 = (input: Input) => {
  const board: Board = [
    [1, 1],
    [input.length - 2, input[0].length - 2],
  ];
  const start: Coord = [0, 1];
  const end: Coord = doMove(board[1], "v");
  const blizzards = new Blizzard(input);
  // console.log({ start, end, board });
  return findPath(start, [end, start, end], blizzards, board);
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
    const board: Board = [
      [1, 1],
      [5, 5],
    ];

    it("just walks when no blizzards", () => {
      const blizzards = new Blizzard([]);
      const distance = findPath([0, 1], [[6, 5]], blizzards, board);
      expect(distance).toBe(10);
    });

    it("knows what's on the board", () => {
      expect(coordsOnBoard([2, 2], board)).toBe(true);
      expect(coordsOnBoard([1, 1], board)).toBe(true);
      expect(coordsOnBoard([0, 1], board)).toBe(false);
      expect(coordsOnBoard([1, 0], board)).toBe(false);
      expect(coordsOnBoard([5, 5], board)).toBe(true);
      expect(coordsOnBoard([6, 5], board)).toBe(false);
      expect(coordsOnBoard([5, 6], board)).toBe(false);

      expect(coordsOnBoard([4, 6], [[1,1],[4,6]])).toBe(true);
      expect(coordsOnBoard([5, 6], [[1,1],[4,6]])).toBe(false);
      expect(coordsOnBoard([4, 7], [[1,1],[4,6]])).toBe(false);
    });

    it("can wrap", () => {
      expect(wrap([1, 1], 4, 6)).toStrictEqual([1,1])
      expect(wrap([4, 1], 6, 8)).toStrictEqual([4,1])
      expect(wrap([5, 1], 6, 8)).toStrictEqual([1,1])
      expect(wrap([0, 1], 6, 8)).toStrictEqual([4,1])
      expect(wrap([1, 0], 6, 8)).toStrictEqual([1,6])
      expect(wrap([1, 7], 6, 8)).toStrictEqual([1,1])
    })
  });

  describe("part 1", () => {
    it("sample", () => {
      expect(part1(parse(testData))).toBe(18);
    });

    it("answer", () => {
      expect(part1(parse(data))).toBe(262);
    });
  });

  describe("part 2", () => {
    it("sample", () => {
      expect(part2(parse(testData))).toBe(54);
    });

    it("answer", () => {
      expect(part2(parse(data))).toBe(785);
    });
  });
});
