import * as R from "ramda";

import { data, testData } from "./input";

type Turn = "L" | "R" | "";
const LEFT: Turn = "L";
const RIGHT: Turn = "R";

type Facing = 0 | 1 | 2 | 3; // Right, Down, Left, Up
const FaceRight: Facing = 0;
const FaceDown: Facing = 1;
const FaceLeft: Facing = 2;
const FaceUp: Facing = 3;

type Cell = " " | "." | "#";
const isCell = (s: string): s is Cell => {
  return " .#".includes(s);
};

type BoardSetup = Cell[][]; // row, col

type Instruction = [number, Turn];
type Input = [BoardSetup, Instruction[]];

const parse = (text: string): Input => {
  const [mapStr, pathStr] = text.split("\n\n");

  const path = R.splitEvery(
    2,
    pathStr.replace(/L/g, ",L,").replace(/R/g, ",R,").split(",")
  ).map((pair): Instruction => {
    const move = parseInt(pair[0]);
    const turn = pair[1] == "L" ? LEFT : pair[1] == "R" ? RIGHT : "";
    return [move, turn];
  });

  const board: BoardSetup = mapStr
    .split("\n")
    .map((line) => line.split("").filter(isCell));
  return [board, path];
};

type Position = [number, number, Facing]; // row, col, face
type Line = [Cell, Position][];

class Board {
  #rows: string[];
  #cols: string[];
  public rMax: number;
  public cMax: number;

  constructor(private setup: BoardSetup) {
    const tSetup = R.transpose(setup);
    this.rMax = Math.max(...setup.map((line) => line.length));
    const rPad = " ".repeat(this.rMax);
    this.cMax = Math.max(...tSetup.map((line) => line.length));
    const cPad = " ".repeat(this.cMax);
    this.#rows = setup.map((line) =>
      (line.join("") + rPad).slice(0, this.rMax)
    );
    this.#cols = tSetup.map((line) =>
      (line.join("") + cPad).slice(0, this.cMax)
    );
  }

  get columns(): number {
    return this.#cols.length;
  }

  getCol(row: number): string {
    return this.#cols[row];
  }

  get rows(): number {
    return this.#rows.length;
  }

  getRow(col: number): string {
    return this.#rows[col];
  }

  getCell(r: number, c: number): Cell {
    if (r >= this.rMax) throw new Error("oops bad row num");
    if (c >= this.cMax) throw new Error("oops bad col num");
    const row = this.#rows[c];
    if (!row) throw new Error(`oops not a row ${r}, ${c}, ${row}, (${this.rMax}x${this.cMax})`);
    const cell = row[r];
    if (isCell(cell)) return cell;
    throw new Error(`oops not a cell ${r}, ${c}, ${cell} (${row.length}/${this.rMax}, ${this.cMax})`);
  }
}

const posButFacing = (pos: Position, face: Facing): Position => {
  return [pos[0], pos[1], face];
};

class Cursor {
  protected row: number;
  protected col: number;
  protected face: Facing;
  constructor(protected board: Board) {
    this.row = 0;
    this.col = board.getRow(0).indexOf(".");
    this.face = 0;
  }

  get pos() {
    return {
      row: this.row + 1,
      col: this.col + 1,
      facing: this.face,
    };
  }

  move(n: number) {
    const f = this.face;
    if (f == 0 || f == 2) {
      this.moveRight(f == 0 ? n : -n);
    } else {
      this.moveDown(f == 1 ? n : -n);
    }
  }

  public setPos(pos: Position) {
    if (this.row >= this.board.cMax) throw "oops pos row";
    if (this.col >= this.board.rMax) throw "oops pos col";
    this.row = pos[0];
    this.col = pos[1];
    this.face = pos[2];
  }

  get currentPosition(): Position {
    return [this.row, this.col, this.face];
  }

  get cMax() {
    return this.board.cMax;
  }
  get rMax() {
    return this.board.rMax;
  }

  protected getCol(n: number): Line {
    // const w = this.walk(this.currentPosition, this.board.rMax);
    // if (w[0][1][2] != this.face) throw "oops walk col facing wrong";
    // return w
    if (n >= this.board.cMax) throw new Error("oops getting bad col");
    const boardCol = this.board.getCol(n);
    const oldCol: Line = boardCol.split("").map((c, idx) => {
      if (!isCell(c)) throw "oops walked too far";
      if (idx >= this.board.cMax)
        throw new Error(
          `oops getting bad col/row (${idx} / ${this.board.cMax}) "${boardCol}"`
        );
      return [c, [idx, n, this.face]];
    });
    return oldCol;
  }

  protected getRow(n: number): Line {
    // const w = this.walk(this.currentPosition, this.board.cMax);
    // if (w[0][1][2] != this.face) throw "oops walk row facing wrong";
    // return w
    if (n >= this.board.cMax) throw new Error("oops getting bad row");
    const boardRow = this.board.getRow(n);
    const oldRow: Line = boardRow.split("").map((c, idx) => {
      if (!isCell(c)) throw "oops walked too far";
      if (idx >= this.board.rMax)
        throw new Error(
          `oops getting bad row/col (${idx} / ${this.board.rMax}(${this.board.cMax})) "${boardRow}" > ${boardRow.length}`
        );
      return [c, [n, idx, this.face]];
    });
    return oldRow;
  }

  protected next(pos: Position): Position {
    switch (pos[2]) {
      case FaceRight:
        return [pos[0], (pos[1] + 1) % this.rMax, pos[2]];
      case FaceDown:
        return [(pos[0] + 1) % this.cMax, pos[1], pos[2]];
      case FaceLeft:
        return [
          pos[0],
          (pos[1] + this.rMax - 1) % this.rMax,
          pos[2],
        ];
      case FaceUp:
        return [
          (pos[0] + this.cMax - 1) % this.cMax,
          pos[1],
          pos[2],
        ];
    }
    throw "oops unknown facing";
  }

  protected walk(pos: Position, n: number): [Cell, Position][] {
    if (n <= 0) return [];
    const next = this.next(pos);
    if (pos[0] > this.cMax) throw new Error("oops bad pos[0]");
    if (pos[1] > this.rMax) throw new Error("oops bad pos[0]");
    const cell = this.board.getCell(pos[0], pos[1]);
    return [[cell, pos], ...this.walk(next, n - 1)];
    throw "oops unhandled end of walk";
  }

  protected moveDown(n: number) {
    const col = this.getCol(this.col);
    this.setPos(doLineMove(col, this.row, n));
  }

  protected moveRight(n: number) {
    const row = this.getRow(this.row);
    this.setPos(doLineMove(row, this.col, n));
  }

  turn(turn: Turn): void {
    this.face += 4;
    if (turn == LEFT) {
      this.face -= 1;
    } else if (turn == RIGHT) {
      this.face += 1;
    }
    this.face %= 4;
  }
}

class BoxCursor extends Cursor {
  // #row: number;
  // #col: number;
  // #face: Facing;
  #squareSize;

  constructor(board: Board) {
    super(board);
    // this.#row = 0;
    // this.#col = board.getRow(0).indexOf(".");
    // this.#face = 0;
    this.#squareSize = Math.max(board.cMax, board.rMax) / 4;
    console.log({ squareSize: this.#squareSize });
    if (this.#squareSize != Math.min(board.cMax, board.rMax) / 3)
      throw "oops square";
  }

  protected walk(pos: Position, n: number): [Cell, Position][] {
    if (n <= 0) return [];
    const next = this.next(pos);
    const nextChr = this.board.getCell(next[0], next[1]);
    if (nextChr == " ") throw "oops walk needs rotate";
    throw "oops unhandled end of walk";
  }

  protected getCol(n: number): Line {
    /* squares:
     * ..#.
     * ###.
     * ..##
     *
     */
    // throw "oops not implemented col"
    return this.walk(this.currentPosition, 4 * this.#squareSize);
    return this.board
      .getCol(n)
      .split("")
      .map((c, idx) => [c as Cell, [idx, n, this.face]]);
  }

  protected getRow(n: number): Line {
    // throw "oops not implemented row"
    return this.board
      .getRow(n)
      .split("")
      .map((c, idx) => [c as Cell, [n, idx, this.face]]);
  }
}

type SquareMap = boolean[][];

const squareAfter = (squareMap: SquareMap, pos: Position) => {
  const squarePos = [pos[0] / 50];
};

const followPath = ([setup, path]: Input) => {
  const board = new Board(setup);
  const cursor = new Cursor(board);
  for (const [move, turn] of path) {
    cursor.move(move);
    cursor.turn(turn);
    // console.log(cursor.pos)
  }
  return cursor.pos;
};

const part1 = (input: Input) => {
  const result = followPath(input);
  console.log({ result });
  const { row, col, facing } = result;
  return 1000 * row + 4 * col + facing;
};

const part2 = (input: Input) => {
  const [setup, path] = input;
  const board = new Board(setup);
  const cursor = new BoxCursor(board);
  for (const [move, turn] of path) {
    cursor.move(move);
    cursor.turn(turn);
    // console.log(cursor.pos)
  }
  const { row, col, facing } = cursor.pos;
  return 1000 * row + 4 * col + facing;
};

const countChars = (chr: string, text: string): number => {
  return text.split(chr).length - 1;
};

const doLineMove = (line: Line, start: number, move: number): Position => {
  const textLine = line.map((c) => c[0]).join("");
  const newPos = doMove(textLine, start, move);
  return line[newPos][1];
};

const doMove = (line: string, start: number, move: number): number => {
  if (move < 0) {
    const revPos = (n: number) => line.length - n - 1;
    const revLine = R.reverse(line);
    const revStart = revPos(start);
    const revMove = doMove(revLine, revStart, -move);
    const result = revPos(revMove);
    // console.log({revLine, revPos, revStart, move, revMove, result});
    return result;
  }
  const result = doMoveIter(line, start, move);
  if (line[result] != ".") {
    console.log({
      msg: "bad result",
      line,
      start,
      chr: line[result],
      move,
      result,
    });
    throw "oops bad result";
  }
  return result;
  // return doMoveRecurse(line, start, move);
};

const doMoveIter = (line: string, start: number, move: number) => {
  let pos = start;
  let prev = pos;
  let text = "";
  const log = (msg: string) => {
    text += `@${pos}(${prev}): ${line[pos]} ${msg}\n`;
  };
  log(line);
  while (move > 0 || line[pos] != ".") {
    const chr = line[pos];
    if (chr == " ") {
      // prev = pos;
      log("skipping space");
      pos += 1;
    } else if (chr == ".") {
      log("move 1");
      prev = pos;
      pos += 1;
      move -= 1;
    }
    if (line[pos] == "#") {
      log("rock!");
      // console.log(text)
      return prev;
    }
    pos %= line.length;
  }
  // console.log(text)
  return pos;
};

describe("day 22", () => {
  it("can parse", () => {
    const parsed = parse(testData);
    expect(parsed[0][0]).toStrictEqual("        ...#".split(""));
    expect(parsed[0][8]).toStrictEqual("        ...#....".split(""));
    expect(parsed[1][0]).toStrictEqual([10, RIGHT]);
  });

  describe("moving", () => {
    it("can move", () => {
      expect(doMove("....", 0, 3)).toBe(3);
      expect(doMove(" ...", 1, 2)).toBe(3);
    });

    it("can move backward", () => {
      expect(doMove("....", 3, -3)).toBe(0);
      expect(doMove(" ...", 3, -2)).toBe(1);
    });

    it("skips blanks", () => {
      expect(doMove(".. ..", 0, 3)).toBe(4);
      expect(doMove(" .. ..", 1, 3)).toBe(5);
    });

    it("stops at rocks", () => {
      expect(doMove("..#..", 0, 3)).toBe(1);
      expect(doMove("#..#..", 1, 3)).toBe(2);
    });

    it("stops at rocks while skipping spaces", () => {
      expect(doMove(" ..#. ", 4, 3)).toBe(2);
    });

    it("wraps", () => {
      expect(doMove(".....", 4, 3)).toBe(2);
      expect(doMove(" ....", 4, 3)).toBe(3);
      expect(doMove(" ....    ", 4, 3)).toBe(3);
    });

    it("wraps exactly at the end", () => {
      expect(doMove(" ....", 2, 3)).toBe(1);
    });

    it("wraps past the end with blanks and rock", () => {
      expect(doMove(" .#.. ", 4, 3)).toBe(1);
    });

    it("wraps backward past the end with blanks and rock", () => {
      expect(doMove(" .#.. ", 1, -3)).toBe(3);
    });
  });

  describe.skip("connecting squares", () => {
    it("can move around a cube", () => {
      const board = new Board(parse(testData)[0]);
      const cursor = new BoxCursor(board);
      cursor.setPos([11, 6, FaceRight]);
      cursor.move(1);
      expect(cursor.pos).toStrictEqual([13, 9, FaceDown]);
    });
    describe.skip("4x3", () => {
      const squareMap = [
        // ..#.
        // ###.
        // ..##
        [false, false, true, false],
        [true, true, true, false],
        [false, false, true, true],
      ];

      it("right from 0,1 is left of 1,1", () => {
        expect(squareAfter(squareMap, [0, 1, FaceRight])).toStrictEqual({
          pos: [1, 1],
          rotation: 0,
        });
      });

      it.skip("up from 0,1 is left of 2,0", () => {
        expect(squareAfter(squareMap, [0, 1, FaceUp])).toStrictEqual({
          pos: [1, 1],
          rotation: 0,
        });
      });
    });
  });

  describe("part 1", () => {
    it("sample", () => {
      expect(part1(parse(testData))).toBe(6032);
    });

    it("answer", () => {
      expect(part1(parse(data))).toBe(131052);
    });
  });

  describe.skip("part 2", () => {
    it("sample", () => {
      expect(part2(parse(testData))).toBe(5031);
    });

    it.skip("answer", () => {
      expect(part2(parse(data))).toBe(-1);
    });
  });
});