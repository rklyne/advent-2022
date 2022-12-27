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
    if (r >= this.cMax)
      throw new Error(
        `oops bad row num ${r}, ${c}, (${this.rMax}x${this.cMax})`
      );
    if (c >= this.rMax)
      throw new Error(
        `oops bad col num  ${r}, ${c}, (${this.rMax}x${this.cMax})`
      );
    const row = this.#rows[r];
    if (!row)
      throw new Error(
        `oops not a row ${r}, ${c}, ${row}, (${this.rMax}x${this.cMax})`
      );
    const cell = row[c];
    if (isCell(cell)) return cell;
    throw new Error(
      `oops not a cell ${r}, ${c}, ${cell} (${row.length}/${this.rMax}, ${this.cMax})`
    );
  }
}

const posButFacing = (pos: Position, face: Facing): Position => {
  return [pos[0], pos[1], face];
};

class Cursor {
  protected row: number;
  protected col: number;
  protected face: Facing;
  public history: Position[];
  useWalk = true;

  constructor(protected board: Board) {
    this.row = 0;
    this.col = board.getRow(0).indexOf(".");
    this.face = 0;
    this.history = [];
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
    const reverse = [FaceLeft, FaceUp].includes(f);
    if (f == 0 || f == 2) {
      this.moveRight(n);
    } else {
      this.moveDown(n);
    }
  }

  public setPos(pos: Position) {
    // if (this.row >= this.board.cMax) throw new Error(`oops pos row ${pos} (${this.board.rMax}x${this.board.cMax})`);
    // if (this.col >= this.board.rMax) throw new Error(`oops pos col ${pos} (${this.board.rMax}x${this.board.cMax})`);
    this.row = pos[0];
    this.col = pos[1];
    this.face = pos[2];
    this.history.push(this.currentPosition);
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
    if (n >= this.board.cMax) throw new Error("oops getting bad col");

    const curr = this.currentPosition;
    const w = this.walk(curr, this.board.cMax);
    if (w[0][1][2] != this.face) throw "oops walk col facing wrong";
    return w;
  }

  protected getRow(n: number): Line {
    if (n >= this.cMax) throw new Error("oops getting bad row");

    const w = this.walk(this.currentPosition, this.board.rMax);
    if (w[0][1][2] != this.face) throw "oops walk row facing wrong";
    return w;
  }

  public next(pos: Position, wrapPosition = true): Position {
    let nextPos: Position;
    const wrap = (pos: Position): Position => {
      return [
        (pos[0] + this.cMax) % this.cMax,
        (pos[1] + this.rMax) % this.rMax,
        pos[2],
      ];
    };
    switch (pos[2]) {
      case FaceRight:
        nextPos = [pos[0], pos[1] + 1, pos[2]];
        break;
      case FaceDown:
        nextPos = [pos[0] + 1, pos[1], pos[2]];
        break;
      case FaceLeft:
        nextPos = [pos[0], pos[1] - 1, pos[2]];
        break;
      case FaceUp:
        nextPos = [pos[0] - 1, pos[1], pos[2]];
        break;
    }
    if (!wrapPosition) return nextPos;
    return wrap(nextPos);
    throw "oops unknown facing";
  }

  protected walk(pos: Position, n: number): [Cell, Position][] {
    if (n <= 0) return [];
    const next = this.next(pos);
    if (pos[0] >= this.cMax) throw new Error("oops bad pos[0]");
    if (pos[1] >= this.rMax) throw new Error("oops bad pos[1]");
    const cell = this.board.getCell(pos[0], pos[1]);
    return [[cell, pos], ...this.walk(next, n - 1)];
    throw "oops unhandled end of walk";
  }

  protected moveDown(n: number) {
    const col = this.getCol(this.col);
    const firstPos = col[0][1];
    // if (firstPos[0] != 0) throw `oops bad col to walk ${firstPos}`
    const start = 0;
    const newPos = doLineMove(col, start, n);
    this.setPos(newPos);
    if (false && this.history.length < 5) {
      console.log({
        col: col.map((c) => c[0]).join(""),
        col0: col[start],
        col1: col[start + 1],
        newPos,
      });
    }
  }

  protected moveRight(n: number) {
    const row = this.getRow(this.row);
    const firstPos = row[0][1];
    // if (firstPos[1] != 0) throw `oops bad row to walk`
    const start = 0;
    const newPos = doLineMove(row, start, n);
    if (false && this.history.length < 5) {
      console.log({
        row: row.map((c) => c[0]).join(""),
        row0: row[start],
        row1: row[start + 1],
        newPos,
      });
    }
    this.setPos(newPos);
  }

  turn(turn: Turn): void {
    if (turn == LEFT) this.turnRelative(-1);
    if (turn == RIGHT) this.turnRelative(1);
  }

  turnRelative(amount: number): void {
    this.face = doTurn(this.face, amount);
  }
}

const doTurn = (f: Facing, amount: number): Facing => {
  return ((f + 4 + amount) % 4) as Facing;
};

const turnPosition = (p: Position, amount: number): Position => {
  return [p[0], p[1], ((p[2] + 4 + amount) % 4) as Facing];
};

class BoxCursor extends Cursor {
  // #row: number;
  // #col: number;
  // #face: Facing;
  #squareSize;
  stitchMap: Record<string, Position>;

  constructor(board: Board) {
    super(board);
    // this.#row = 0;
    // this.#col = board.getRow(0).indexOf(".");
    // this.#face = 0;
    this.#squareSize = Math.max(board.cMax, board.rMax) / 4;
    // console.log({ squareSize: this.#squareSize });
    if (this.#squareSize != Math.min(board.cMax, board.rMax) / 3)
      throw "oops square";
    this.stitchMap = stitch(board);
  }

  protected walk(pos: Position, n: number): [Cell, Position][] {
    if (n <= 0) return [];
    if (pos[0] >= this.cMax) throw new Error("oops bad pos[0]");
    if (pos[1] >= this.rMax) throw new Error("oops bad pos[1]");
    const cell = this.board.getCell(pos[0], pos[1]);
    const myId = posId(pos);
    let next;
    if (myId in this.stitchMap) {
      next = this.stitchMap[myId];
      // console.log({next, nextId, pos})
    } else {
      next = this.next(pos);
    }
    const wrap = (pos: Position): Position => {
      return [
        (pos[0] + this.cMax) % this.cMax,
        (pos[1] + this.rMax) % this.rMax,
        pos[2],
      ];
    };
    if (!R.equals(next, wrap(next))) {
      // this shouldn't happen when edges are all stitch mapped
      throw "oops wrapping :(";
    }
    next = wrap(next);
    let nextCell: Cell = this.board.getCell(next[0], next[1]);
    if (nextCell == " ") {
      throw "oops next cell blank";
    }
    return [[cell, pos], ...this.walk(next, n - 1)];
  }

  protected getCol(n: number): Line {
    return this.walk(this.currentPosition, 4 * this.#squareSize);
  }

  public getRow(n: number): Line {
    return this.walk(this.currentPosition, 4 * this.#squareSize);
  }
}

type SquareMap = boolean[][];

const squareAfter = (squareMap: SquareMap, pos: Position) => {
  const squarePos = [pos[0] / 50];
};

const part1 = (input: Input) => {
  const [setup, path] = input;
  const board = new Board(setup);
  const cursor = new Cursor(board);
  for (const [move, turn] of path) {
    cursor.move(move);
    cursor.turn(turn);
    // console.log(cursor.pos)
  }
  const { row, col, facing } = cursor.pos;
  // console.log({ result: cursor.pos, history: cursor.history });
  return 1000 * row + 4 * col + facing;
};

const part2 = (input: Input) => {
  const [setup, path] = input;
  const board = new Board(setup);
  const cursor = new BoxCursor(board);
  for (const [move, turn] of path) {
    cursor.move(move);
    cursor.turn(turn);
    // console.log({ move, turn, pos: cursor.pos });
  }
  const { row, col, facing } = cursor.pos;
  console.log(cursor.pos);
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
    throw "oops, should be accounted in row";
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

const posId = (pos: Position): string => pos.join(",");

const stitch = (board: Board): Record<string, Position> => {
  const seen = new Set<string>();
  const stitched = {};
  // 1. find start
  // - 0, 0
  // - move right until hit
  // - move down until hit.
  // - this is an inside corner
  const startCol =
    Math.min(board.getRow(0).indexOf("#"), board.getRow(0).indexOf(".")) - 1;
  const startRow =
    Math.min(
      board.getCol(startCol).indexOf("#"),
      board.getCol(startCol).indexOf(".")
    ) - 1;
  // - start on each side of this corner
  let left: Position = [startRow + 1, startCol, FaceUp];
  let right: Position = [startRow, startCol + 1, FaceLeft];
  let leftId = posId(left);
  let rightId = posId(right);
  const cursor = new Cursor(board);
  const doMove = (pos: Position, relativeTurn: number): Position => {
    cursor.setPos(pos);
    cursor.turnRelative(relativeTurn);
    cursor.setPos(cursor.next(cursor.currentPosition, false));
    cursor.turnRelative(-relativeTurn);
    return cursor.currentPosition;
  };
  const getCell = (pos: Position): Cell => {
    try {
      return board.getCell(pos[0], pos[1]);
    } catch (e) {
      return " ";
    }
  };
  const next = (
    pos: Position,
    relativeTurn: number
  ): [Position, "inside" | "outside" | "straight"] => {
    // - if next step in line is part of the edge, continue
    //   - else if its a turn then turn - one of these shapes:
    //     ##  ..
    //     .#  .#
    //     ^   ^
    //
    const nextPos = doMove(pos, relativeTurn);
    if (getCell(nextPos) == " ") {
      return [turnPosition(pos, relativeTurn), "outside"];
    }
    const ahead = doMove(nextPos, 0);
    if (getCell(ahead) == " ") {
      return [nextPos, "straight"];
    }
    return [turnPosition(ahead, -relativeTurn), "inside"];
  };
  let limit = 30000;
  type Todo = [Position, Position];
  const pairsTodo: Todo[] = [[left, right]];
  let walkPos = right;

  let perimeterLength = 0;
  do {
    perimeterLength++;
    limit--;
    if (limit <= 0) throw "oops stitch walk limit";

    const nextPos = next(walkPos, 1);
    if (nextPos[1] == "inside") {
      pairsTodo.push([walkPos, nextPos[0]]);
    }
    walkPos = nextPos[0];
  } while (!R.equals(walkPos, right));

  limit = 30000;
  let stitches = 0;
  // console.log(pairsTodo);
  while (pairsTodo.length > 0) {
    stitches++;
    limit--;
    if (limit <= 0) {
      throw "oops stitch limit";
    }
    const [l, r] = pairsTodo.shift();
    const lId = posId(l);
    const rId = posId(r);
    if (seen.has(lId) || seen.has(rId)) {
      continue;
    }
    seen.add(lId);
    seen.add(rId);
    // 2. walk around the edges from this point in two opposite directions.
    // - if next step in line is part of the edge, continue
    //   - else if its a turn then turn - one of these shapes:
    //     ##  ..
    //     .#  .#
    //     ^   ^
    //
    stitched[lId] = turnPosition(r, 2);
    stitched[rId] = turnPosition(l, 2);
    const nextL = next(l, -1);
    const nextR = next(r, 1);
    // Can't take two outside turns together and stitch them - cubes don't work li that.
    if (nextL[1] == "outside" && nextR[1] == "outside") continue
    const nextPair: Todo = [nextL[0], nextR[0]];
    // console.log({nextPair, l: pairsTodo.length})
    pairsTodo.push(nextPair);
  }
  // - stop when the edges meet again
  // console.log({ perimeterLength, stitches });
  return stitched;
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

    it.skip("can move backward", () => {
      expect(doMove("....", 3, -3)).toBe(0);
      expect(doMove(" ...", 3, -2)).toBe(1);
    });

    it("skips blanks", () => {
      expect(doMove(".. ..", 0, 3)).toBe(4);
      expect(doMove(" .. ..", 1, 3)).toBe(5);
    });

    it("stops at rocks", () => {
      expect(doMove("..#..", 0, 3)).toBe(1);
      expect(doMove("..#..", 1, 1)).toBe(1);
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

    it.skip("wraps backward past the end with blanks and rock", () => {
      expect(doMove(" .#.. ", 1, -3)).toBe(3);
    });
  });

  describe("connecting squares", () => {
    it("can stitch edges together", () => {
      const input = parse(testData);
      const stitchMap = stitch(new Board(input[0]));
      expect(stitchMap["6,11,0"]).toStrictEqual([8, 13, 1]);
    });

    it("can move around a cube", () => {
      const board = new Board(parse(testData)[0]);
      const cursor = new BoxCursor(board);
      cursor.setPos([6, 11, FaceRight]);
      expect(board.getCell(6, 11)).toBe(".");
      expect(
        cursor
          .getRow(11111)
          .map(([c, p]) => c)
          .join("")
      ).toBe("..#....#....#...");
      cursor.move(1);
      expect(cursor.currentPosition).toStrictEqual([8, 13, FaceDown]);
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

  describe("part 2", () => {
    it("sample", () => {
      expect(part2(parse(testData))).toBe(5031);
    });

    it("answer", () => {
      expect(part2(parse(data))).toBe(4578);
    });
  });
});
