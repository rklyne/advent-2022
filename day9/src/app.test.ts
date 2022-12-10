import * as R from "ramda";
import { input } from "./input";

type Dir = "U" | "D" | "L" | "R";
type Command = [Dir, number];

type Position = [number, number];
type State = [Position, Position];

const start: State = [
  [0, 0],
  [0, 0],
];

export const parse = (text: string): Command[] => {
  return text
    .split("\n")
    .map((s) => s.trim().split(" "))
    .map(([dir, n]) => [dir as Dir, parseInt(n)]);
};

const processCommandsToStates = (state: State, commands: Command[]): State[] => {
  const states = []
  let newState = state;
  for (const cmd of commands) {
    for (const i of R.range(0, cmd[1])) {
      newState = processStep(newState, cmd[0]);
      states.push(newState);
    }
  }
  return states;
};

const processCommands = (state: State, commands: Command[]): State => {
  const states = processCommandsToStates(state, commands)
  return states[states.length-1];
};



const processStep = (state: State, dir: Dir): State => {
  const newHead: Position = [state[0][0], state[0][1]];
  if (dir == "U") {
    newHead[1] += 1;
  } else if (dir == "D") {
    newHead[1] -= 1;
  } else if (dir == "L") {
    newHead[0] -= 1;
  } else if (dir == "R") {
    newHead[0] += 1;
  }
  return updateTail([newHead, state[1]]);
};

const updateTail = (state: State): State => {
  const step = (n: number) => {
    if (n == 0) return 0;
    return n / Math.abs(n);
  };
  const head = state[0];
  const oldTail = state[1];
  if (
    Math.abs(head[0] - oldTail[0]) <= 1 &&
    Math.abs(head[1] - oldTail[1]) <= 1
  ) {
    return state;
  }
  const newTail: Position = [
    oldTail[0] + step(head[0] - oldTail[0]),
    oldTail[1] + step(head[1] - oldTail[1]),
  ];
  return [state[0], newTail];
};

export const part1 = (commands: Command[]): number => {
  const states = processCommandsToStates(start, commands);
  return R.uniq(states.map(state => state[1])).length
}

describe("day 9", () => {
  it("can parse", () => {
    const parsed = parse(input);
    expect(parsed[0]).toStrictEqual(["L", 2]);
    expect(parsed[1]).toStrictEqual(["R", 2]);
    expect(parsed[2]).toStrictEqual(["U", 1]);
  });

  it("the head moves", () => {
    expect(processCommands(start, [["R", 1]])).toStrictEqual([
      [1, 0],
      [0, 0],
    ]);
    expect(processCommands(start, [["L", 1]])).toStrictEqual([
      [-1, 0],
      [0, 0],
    ]);
    expect(processCommands(start, [["U", 1]])).toStrictEqual([
      [0, 1],
      [0, 0],
    ]);
    expect(processCommands(start, [["D", 1]])).toStrictEqual([
      [0, -1],
      [0, 0],
    ]);
  });

  it("the head moves multiple times when commanded", () => {
    expect(processCommands(start, [["R", 2]])[0]).toStrictEqual([2, 0]);
  });

  it("the tail follows the head in a line", () => {
    expect(processCommands(start, [["R", 2]])).toStrictEqual([
      [2, 0],
      [1, 0],
    ]);
  });

  it("the tail follows the head in a diagonal", () => {
    expect(
      processCommands(start, [
        ["R", 1],
        ["U", 2],
      ])
    ).toStrictEqual([
      [1, 2],
      [1, 1],
    ]);
  });

  const testData = `R 4
    U 4
    L 3
    D 1
    R 4
    D 1
    L 5
    R 2`

  describe("part 1", () => {
    it("can solve the sample", () => {
      expect(part1(parse(testData))).toBe(13)
    })
    it("can solve the problem", () => {
      expect(part1(parse(input))).toBe(-1)
    })
  })
});
