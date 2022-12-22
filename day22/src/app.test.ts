import * as R from "ramda";

import { data, testData } from "./input";

type Turn = "L" | "R" | "";
const LEFT: Turn = "L";
const RIGHT: Turn = "R";

type Facing = 0 | 1 | 2 | 3; // Right, Down, Left, Up

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

class Board {
  #rows: string[];
  #cols: string[];

  constructor(private setup: BoardSetup) {
    this.#rows = setup.map((line) => line.join(""));
    this.#cols = R.transpose(setup).map((line) => line.join(""));
  }

  get columns(): number {
    return this.#cols.length;
  }

  getCol(n: number) {
    return this.#cols[n];
  }

  get rows(): number {
    return this.#rows.length;
  }

  getRow(n: number) {
    return this.#rows[n];
  }
}

class Cursor {
  #row: number;
  #col: number;
  #face: Facing;
  constructor(private board: Board) {
    this.#row = 0;
    this.#col = board.getRow(0).indexOf(".");
    this.#face = 0;
  }

  get pos() {
    return {
      row: this.#row,
      col: this.#col,
      facing: this.#face,
    };
  }

  move(n: number) {
    const f = this.#face;
    if (f == 0 || f == 2) {
      this.moveRight(f == 0 ? n : -n);
    } else {
      this.moveDown(f == 1 ? n : -n);
    }
  }

  private moveDown(n: number) {
    const col = this.board.getCol(this.#col);
    this.#row = doMove(col, this.#row, n);
  }

  private moveRight(n: number) {}

  turn(turn: Turn): void {
    this.#face += 4;
    if (turn == LEFT) {
      this.#face += 1;
    } else if (turn == RIGHT) {
      this.#face -= 1;
    }
    this.#face %= 4;
  }
}

const followPath = ([setup, path]: Input) => {
  const board = new Board(setup);
  const cursor = new Cursor(board);
  for (const [move, turn] of path) {
    cursor.move(move);
    cursor.turn(turn);
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
  return 0;
};

const countChars = (chr: string, text: string): number => {
  return text.split(chr).length - 1;
};

const doMove = (line: string, start: number, move: number) => {
  if (move < 0) {
    const revPos = (n: number) => line.length - n - 1;
    const revLine = R.reverse(line)
    const revStart = revPos(start)
    const revMove = doMove(revLine, revStart, -move);
    const result = revPos(revMove);
    // console.log({revLine, revPos, revStart, move, revMove, result});
    return result
  }
  return doMoveIter(line, start, move);
  // return doMoveRecurse(line, start, move);
};

const doMoveRecurse = (
  line: string,
  start: number,
  move: number,
  log = false
) => {
  if (move == 0) {
    return start;
  } else if (start >= line.length) {
    return doMove(line, start % line.length, move);
  }
  const TOO_FAR = "too far";
  const chr = line[start];
  try {
    if (chr == " ") {
      return doMove(line, start + 1, move);
    } else if (chr == ".") {
      return doMove(line, start + 1, move - 1);
    }
  } catch (err) {
    if (err == TOO_FAR) {
      return start;
    }
    throw err;
  }
  if (chr == "#") {
    throw TOO_FAR;
  }
};

const doMoveIter = (line: string, start: number, move: number) => {
  let pos = start;
  let prev = pos;
  let text = ""
  const log = (msg: string) => {
    text += `@${pos}(${prev}): ${line[pos]} ${msg}\n`
  }
  log(line)
  while (move > 0) {
    const chr = line[pos];
    if (chr == " ") {
      // prev = pos;
      log("skipping space")
      pos += 1;
    } else if (chr == ".") {
      log("move 1")
      prev = pos;
      pos += 1;
      move -= 1;
    }
    if (line[pos] == "#") {
      log("rock!")
      // console.log(text)
      return prev;
    }
    pos %= line.length;
  }
  // console.log(text)
  return pos;
};

describe("day X", () => {
  it("can parse", () => {
    const parsed = parse(testData);
    expect(parsed[0][0]).toStrictEqual("        ...#".split(""));
    expect(parsed[0][8]).toStrictEqual("        ...#....".split(""));
    expect(parsed[1][0]).toStrictEqual([10, RIGHT]);
  });

  describe("moving", () => {
    // TODO:
    // - move backward
    //   - past blanks
    //   - and rocks
    // - put it all together in one test
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
    })

    it("wraps", () => {
      expect(doMove(".....", 4, 3)).toBe(2);
      expect(doMove(" ....", 4, 3)).toBe(3);
      expect(doMove(" ....    ", 4, 3)).toBe(3);
    });

    it("wraps past the end with blanks and rock", () => {
      expect(doMove(" .#.. ", 4, 3)).toBe(1);
    });

    it("wraps backward past the end with blanks and rock", () => {
      expect(doMove(" .#.. ", 1, -3)).toBe(3);
    });
  });

  describe("part 1", () => {
    it("sample", () => {
      expect(part1(parse(testData))).toBe(6032);
    });

    it("answer", () => {
      expect(part1(parse(data))).toBe(-1);
      // too high: 149200
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
