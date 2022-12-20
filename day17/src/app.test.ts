import * as R from "ramda";

import { data, testData, rocksData } from "./input";

type Point = [number, number]; // row, column
type Cell = "#" | ".";
const ROCK: Cell = "#";
const AIR: Cell = ".";
type Grid = Cell[][]; // row, column
type Rock = Grid;

type Move = "<" | ">";
const LEFT: Move = "<";
const RIGHT: Move = ">";

const parse = (text: string): Move[] => {
  return text.split("").map((c) => {
    if (c == "<") return LEFT;
    if (c == ">") return RIGHT;
    throw "oops parse";
  });
};

const makeRow = (w: number, init: Cell = AIR): Cell[] => {
  return R.range(0, w).map((r) => {
    return init;
  });
};

const makeGrid = (w: number, h: number, init: Cell = AIR): Grid => {
  return R.range(0, h).map((c) => {
    return makeRow(w, init);
  });
};

const loadRocks = (): Rock[] => {
  return rocksData.split("\n\n").map((rockText) => {
    const lines = rockText.split("\n");
    const w = lines[0].length;
    const h = lines.length;
    const grid = makeGrid(w, h);
    lines.forEach((line, row) => {
      line.split("").forEach((chr, col) => {
        if (chr == "#") {
          grid[row][col] = ROCK;
        }
      });
    });
    return grid;
  });
};

const gridPositions = (grid: Grid, offset: Point = [0, 0]): Point[] => {
  const points: Point[] = [];
  for (const row of R.range(0, grid.length)) {
    for (const col of R.range(0, grid[row].length)) {
      points.push([row + offset[0], col + offset[1]]);
    }
  }
  return points;
};

type LoopState = {
  rows: number;
  query: string;
  rockStart: number;
  rocks?: number;
};
type GameState = {
  steps: number;
  highestRock: number;
  removedRows: number;
  rocks: Rock[];
  grid: Grid;
  moves: Move[];
  rocksDone: number;
  width: number;
  fallingRock?: Rock;
  fallingRockLeft?: number;
  fallingRockHeight?: number;
  log: string;
  loop?: LoopState;
};

const makeGame = (moves: Move[]): GameState => {
  const width = 7;
  return {
    highestRock: 0,
    removedRows: 0,
    rocks: loadRocks(),
    width,
    grid: makeGrid(width, 1),
    moves,
    rocksDone: 0,
    steps: 0,
    log: "",
  };
};

const cycleOne = <T>(lst: T[]): T => {
  const next = lst.shift();
  lst.push(next);
  return next;
};

const gameStep = (
  previousState: GameState,
  onCycle: (game: GameState) => void
): GameState => {
  const heightGrowth = 8;
  const game = { ...previousState };
  const log = (msg: string) => {
    // game.log += "\n" + msg;
  };
  game.steps += 1;
  const goneTooLow = game.fallingRockHeight > game.highestRock + 10;
  if (goneTooLow) throw "oops algorithm fail";

  let shifted = 0;
  while (game.grid.length < game.highestRock + heightGrowth) {
    game.grid.unshift(makeRow(game.width));
    shifted++;
    if (shifted > 10 + heightGrowth) throw "oops shift";
  }

  const currentPos = (): Point => [
    game.fallingRockHeight,
    game.fallingRockLeft,
  ];

  const rockCanBeAt = (offsets: Point): boolean => {
    const rocksInDesiredPos: boolean[] = gridPositions(game.fallingRock).map(
      ([row, col]) => {
        if (!game.grid[row + offsets[0]]) return true;
        if (game.fallingRock[row][col] != ROCK) return false;
        const r = row + offsets[0];
        const c = col + offsets[1];
        if (c > 6) {
          console.log({
            offsets,
            rock: game.fallingRock,
            move: game.moves[game.moves.length - 1],
            r,
            c,
          });
          throw "bad y";
        }
        return game.grid[r][c] == ROCK;
      }
    );
    return !R.reduce(R.or, false, rocksInDesiredPos);
  };

  const posLeft: Point = [currentPos()[0], currentPos()[1] - 1];
  const posRight: Point = [currentPos()[0], currentPos()[1] + 1];

  const doGasJetPush = () => {
    const nextMove = cycleOne(game.moves);
    if (nextMove == LEFT) {
      if (game.fallingRockLeft > 0 && rockCanBeAt(posLeft)) {
        game.fallingRockLeft -= 1;
        log(nextMove + "yes");
      } else {
        log(nextMove + "no");
      }
    } else {
      if (
        game.fallingRockLeft + game.fallingRock[0].length < 7 &&
        rockCanBeAt(posRight)
      ) {
        game.fallingRockLeft += 1;
        log(nextMove + "yes");
      } else {
        log(nextMove + "no");
      }
    }
  };

  const findCycles = (): void => {
    const searchGrid = game.grid
      .map((row) => row.join(""))
      .filter((row) => row != ".......");
    const searchStr = searchGrid.join("|");
    if (game.loop) {
      if (searchStr.slice(0, game.loop.query.length) == game.loop.query) {
        // we looped
        game.loop.rocks = game.rocksDone - game.loop.rockStart;
        onCycle(game);
      }
      return;
    }
    const max = game.highestRock;
    // if (max % 2 != 0) return;
    const checkLen = game.moves.length * game.rocks.length;
    const matchLen = 400 * 8;
    const query = searchStr.slice(0, matchLen);
    const found = searchStr.indexOf(query, 1);
    if (found == -1) return;
    const loopRows = found / 8;
    game.loop = {
      rows: loopRows,
      query,
      rockStart: game.rocksDone,
    };
    // onCycle(game);
  };

  const clearEmpties = (): void => {
    // I think this is a bad idea.
    // It keeps memory under control but it prevents cycle detection
    const fullRow = (): number | undefined => {
      for (const r of R.range(0, 10)) {
        if (!game.grid[r]) return;
        if (R.all((c) => c == ROCK, game.grid[r])) return r;
      }
    };
    const row = fullRow();
    if (!row) return;
    const pre = game.grid.length;
    const removed = game.grid.length - row;
    game.removedRows += removed;
    game.grid = game.grid.slice(0, row);
    // console.log(`split ${pre}@${row} => ${game.grid.length} + (${removed})`)
    // printGame(game, false)
    if (pre != removed + game.grid.length) {
      throw "oops split";
    }
  };

  if (!game.fallingRock) {
    log("new rock");
    const nextRock = cycleOne(game.rocks);
    game.fallingRock = nextRock;
    const spareHeight = game.grid.length - game.highestRock;
    const rockHeight = nextRock.length;
    game.fallingRockHeight = spareHeight - rockHeight - 3;
    if (game.fallingRockHeight < 0) throw "oops not high enough";
    game.fallingRockLeft = 2;
    return game;
  }

  // falling rock
  doGasJetPush();
  const posDown: Point = [currentPos()[0] + 1, currentPos()[1]];

  //   if can fall further then move it
  if (rockCanBeAt(posDown)) {
    game.fallingRockHeight += 1;
    log("down");
  } else {
    // else move it to the grid where it is
    gridPositions(game.fallingRock).map(([row, col]) => {
      if (game.fallingRock[row][col] != ROCK) return;
      game.grid[row + currentPos()[0]][col + currentPos()[1]] = ROCK;
    });
    // reset
    game.fallingRock = null;
    game.rocksDone += 1;
    // clearEmpties()
    // compute new max height
    game.highestRock = game.grid.length;
    for (const i in R.range(0, heightGrowth)) {
      if (R.all((c) => c == AIR, game.grid[i])) {
        game.highestRock--;
      }
    }
    findCycles();
  }

  return game;
};

const printGame = (game: GameState, log = false): void => {
  const rows = game.grid.map((row) => {
    return "|" + row.join("") + "|";
  });
  rows.push("+-------+");
  let text = rows.join("\n");
  if (log) text += "\n" + game.log;
  console.log(text);
};

const runGame = (
  moves: Move[],
  MAX_ROCKS: number,
  printEach = false
): GameState => {
  let game = makeGame(moves);
  let max = MAX_ROCKS;
  let rowBoost = 0;
  while (game.rocksDone < max) {
    game = gameStep(game, (game) => {
      if (rowBoost) return
      const remainingRocks = MAX_ROCKS - game.rocksDone
      const skipCycles = Math.floor(remainingRocks / game.loop.rocks)
      const skipRocks = (game.loop.rocks * skipCycles)
      rowBoost = skipCycles * game.loop.rows

      console.log({
        msg: "loop detected",
        currentHighestRock: game.highestRock,
        loop_rocks: game.loop.rocks,
        loop_rows: game.loop.rows,
        skipRocks,
        rowBoost,
        remainingRocks,
      });
      max -= skipRocks
    });
    if (printEach) printGame(game, false);
  }
  game.highestRock += rowBoost
  return game;
};

const part1 = (moves: Move[]) => {
  const MAX_ROCKS = 2022;
  const game = runGame(moves, MAX_ROCKS);
  // printGame(game, false);
  const total = game.highestRock + game.removedRows;
  // console.log({ high: game.highestRock, removed: game.removedRows, total });
  return total;
};

const part2 = (moves: Move[]) => {
  const MAX_ROCKS = 1_000_000_000_000;
  // const MAX_ROCKS = 10_000;
  const game = runGame(moves, MAX_ROCKS);
  const total = game.highestRock + game.removedRows;
  // console.log({ high: game.highestRock, removed: game.removedRows, total });
  return total;
};

describe("", () => {
  it("has rocks", () => {
    expect(loadRocks()[0]).toStrictEqual([[ROCK, ROCK, ROCK, ROCK]]);
  });

  describe("falling rocks", () => {
    it("it right at 1 rocks", () => {
      const game = runGame(parse(testData), 1);
      // printGame(game);
      expect(game.highestRock).toBe(1);
    });

    it("it right at 3 rocks", () => {
      const game = runGame(parse(testData), 3);
      // printGame(game);
      expect(game.highestRock).toBe(6);
    });

    it("it right at 10 rocks", () => {
      const game = runGame(parse(testData), 10);
      // printGame(game, false);
      expect(game.highestRock).toBe(17);
    });
  });

  describe("part1", () => {
    it("sample", () => {
      expect(part1(parse(testData))).toBe(3068);
    });
    it("answer", () => {
      expect(part1(parse(data))).toBe(3144);
    });
  });

  describe("part2", () => {
    it("sample", () => {
      expect(part2(parse(testData))).toBe(1514285714288);
    });
    it("answer", () => {
      expect(part2(parse(data))).toBe(1565242165201);
    });
  });
});
