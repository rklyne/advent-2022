import * as R from "ramda";
import { data } from "./input";

type Point = [number, number];
type Line = Point[];
const parse = (text: string): Line[] => {
  return text
    .split("\n")
    .map((line) => eval("[[" + line.trim().replace(/ -> /g, "], [") + "]]"));
};

type CellState = "." | "o" | "#";
const ROCK: CellState = "#";
const SAND: CellState = "o";
const AIR: CellState = ".";
type CellStateList = string;

class Model {
  private maxDepth: number;
  private columns: CellStateList[]; // index column, row
  private maxColumn = 1000;
  private emptyColumn: string;
  constructor(private lines: Line[], addFloor=false) {
    this.maxDepth =
      (R.reduce(
        R.max,
        0,
        R.reduce(Array.prototype.concat, lines[0], lines).map(
          (point) => point[1]
        )
      ) as number) + 1;
    this.emptyColumn = AIR.repeat(this.maxDepth+1) + (addFloor?ROCK:"");
    this.columns = R.range(0, this.maxColumn + 1).map((n) => this.emptyColumn);
    this.addRocks(this.lines);
  }

  setCell(c: number, r: number, value: CellState): void {
    const col = this.columns[c];
    this.columns[c] = col.slice(0, r) + value + col.slice(r + 1);
  }

  addRocks(lines: Line[]): void {
    let rocks = 0;
    lines.forEach((line) => {
      R.zip(line, line.slice(1)).forEach((pointPair) => {
        const point1 = pointPair[0];
        const point2 = pointPair[1];
        for (const c of R.range(
          Math.min(point1[0], point2[0]),
          Math.max(point1[0], point2[0]) + 1
        )) {
          for (const r of R.range(
            Math.min(point1[1], point2[1]),
            Math.max(point1[1], point2[1]) + 1
          )) {
            this.setCell(c, r, ROCK);
            rocks += 1;
          }
        }
      });
    });
    console.log({ addedRocks: rocks });
  }

  addSand(point: Point): boolean {
    const [c, r] = point;
    const col = this.columns[c];
    if (col[r] != AIR) return false;
    const colFromR = col.slice(r);
    const rock = colFromR.indexOf(ROCK);
    if (rock == -1) return false;
    const sand = colFromR.indexOf(SAND);
    const blockage = (sand == -1 ? rock : Math.min(sand, rock)) + r;
    if (blockage < r) {
      console.log({ blockage, r, col, rock });
      throw "bad fall";
    }

    // console.log({ blockedBy: col[blockage], above: col[blockage - 1] });

    // try left-down
    if (this.columns[c - 1][blockage] == AIR) {
      return this.addSand([c - 1, blockage]);
    }
    // try right-down
    if (this.columns[c + 1][blockage] == AIR) {
      return this.addSand([c + 1, blockage]);
    }

    this.setCell(c, blockage - 1, SAND);
    return true; // did we keep the sand?
  }

  allPoints(): Point[] {
    const points: Point[] = [];
    for (const c of R.range(0, this.columns.length)) {
      const column = this.columns[c];
      for (const r of R.range(0, column.length)) {
        points.push([c, r]);
      }
    }
    return points;
  }

  sandPoints(): Point[] {
    const points: Point[] = [];
    for (const point of this.allPoints()) {
      if (this.columns[point[0]][point[1]] == SAND) {
        points.push(point);
      }
    }
    return points;
  }

  print(): void {
    const s = R.transpose(
      this.columns
        .filter((c) => c != this.emptyColumn)
        .map((s) => Array.from(s))
    )
      .map((l) => l.join(""))
      .join("\n");
    console.log(s);
  }
}

const part1 = (lines: Line[]): number => {
  const maxCycles = 1000;
  const model = new Model(lines);
  let cycles = 0;
  while (model.addSand([500, 0])) {
    cycles += 1;
    if (cycles > maxCycles) break;
  }
  // model.print();
  return cycles;
  // const sand = model.sandPoints();
  // return sand.length;
};

const part2 = (lines: Line[]): number => {
  const maxCycles = 1000000;
  const model = new Model(lines, true);
  let cycles = 0;
  while (model.addSand([500, 0])) {
    cycles += 1;
    if (cycles > maxCycles) break;
  }
  // model.print();
  return cycles;
  // const sand = model.sandPoints();
  // return sand.length;
};

describe("day 14", () => {
  it("can parse", () => {
    expect(parse(data)[0]).toStrictEqual([
      [492, 26],
      [492, 17],
      [492, 26],
      [494, 26],
      [494, 16],
      [494, 26],
      [496, 26],
      [496, 22],
      [496, 26],
      [498, 26],
      [498, 17],
      [498, 26],
      [500, 26],
      [500, 20],
      [500, 26],
      [502, 26],
      [502, 25],
      [502, 26],
      [504, 26],
      [504, 23],
      [504, 26],
      [506, 26],
      [506, 21],
      [506, 26],
      [508, 26],
      [508, 16],
      [508, 26],
      [510, 26],
      [510, 24],
      [510, 26],
    ]);
  });

  const testData = `498,4 -> 498,6 -> 496,6
    503,4 -> 502,4 -> 502,9 -> 494,9`;

  describe("part 1", () => {
    it("sample", () => {
      expect(part1(parse(testData))).toBe(24);
    });
    it("answer", () => {
      expect(part1(parse(data))).toBe(768);
    });
    });
  describe("part 2", () => {
    it("sample", () => {
      expect(part2(parse(testData))).toBe(93);
    });
    it("answer", () => {
      expect(part2(parse(data))).toBe(26686);
    });
  });
});
