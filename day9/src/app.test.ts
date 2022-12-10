import * as R from "ramda";
import { input } from "./input";
import { Timer } from "./timing";

type Dir = "U" | "D" | "L" | "R";
type Command = [Dir, number];

type Position = [number, number];
type State = [Position, Position];

const timer = new Timer();

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

const processCommandsToStates = (
  state: State,
  commands: Command[]
): State[] => {
  const states = [];
  run(state, commands, (newState => {states.push([...newState])}))
  return states;
};

const run = (
  state: State,
  commands: Command[],
  observe: (state: State) => void,
): void => {
  let newState = state;
  for (const cmd of commands) {
    for (const i of R.range(0, cmd[1])) {
      newState = timer.timed(processStep)(newState, cmd[0]);
      observe(newState);
    }
  }
}

const processCommands = (state: State, commands: Command[]): State => {
  const states = processCommandsToStates(state, commands);
  return states[states.length - 1];
};

const processMove = (pos: Position, dir: Dir): Position => {
  const newHead: Position = [pos[0], pos[1]]
  if (dir == "U") {
    newHead[1] += 1;
  } else if (dir == "D") {
    newHead[1] -= 1;
  } else if (dir == "L") {
    newHead[0] -= 1;
  } else if (dir == "R") {
    newHead[0] += 1;
  }
  return newHead
}

const _step = R.memoizeWith((n) => n.toString(), (n: number) => {
  if (n == 0) return 0;
  return n / Math.abs(n);
});

const moveRelative = (pos: Position): Position => {
  if (
    Math.abs(pos[0]) <= 1 &&
    Math.abs(pos[1]) <= 1
  ) {
    return [0, 0]
  }
  return [
    _step(pos[0]),
    _step(pos[1]),
  ];
}

const processStep = (state: State, dir: Dir): State => {
  const newHead = processMove(state[0], dir)
  const newTail: Position = R.zipWith(
    R.add,
    timer.timed(moveRelative)(
      R.zipWith(R.subtract, newHead, state[1]) as unknown as Position
    ),
    state[1]
  ) as unknown as Position
  return [newHead, newTail]
};

export const part1 = (commands: Command[]): number => {
  const states = timer.timed(processCommandsToStates)(start, commands);
  const seen: Record<string, number>= {}
  run(start, commands, (state)=>{
    seen[state[state.length-1].toString()] = 1
  })
  return R.sum(Object.values(seen))
  return R.uniq(states.map((state) => state[1])).length;
};

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
    R 2`;

  describe("part 1", () => {
    it("can solve the sample", () => {
      expect(part1(parse(testData))).toBe(13);
    });
    it("isn't slow", () => {
      timer.reset();
      try {
        expect(part1(parse(input).slice(0, 600))).toBe(617);
      } finally {
        timer.print();
      }
    });
    it("can solve the problem", () => {
      timer.reset();
      try {
        expect(part1(parse(input))).toBe(5883);
      } finally {
        timer.print();
      }
    });
  });
});
