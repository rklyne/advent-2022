import { input, testData } from "./input";

type State = [number, number]; // cycles, register
const newMachine = (): State => [1, 1];

type Instruction = { op: "noop" } | { op: "addx"; x: number };
const NOOP: Instruction = {op: "noop"}
const doInstruction = (state: State, instr: Instruction): State[] => {
  const states: State[] = [[state[0] + 1, state[1]]];
  if (instr.op == 'addx') {
    states.push([state[0]+2, state[1] + instr.x])
  }
  return states;
};

const run = (instrs: Instruction[], observe: (state: State) => void) => {
  let state = newMachine();
  instrs.forEach(instr => {
    doInstruction(state, instr).forEach(newState => {
      observe(newState)
      state = newState
    })
  })
}

const parse = (input: string): Instruction[] => {
  return input.split("\n").map(
    line => {
      const t = line.trim()
      if (t == "noop") return NOOP
      return {op: "addx", x: parseInt(t.split(" ")[1])}
    }
  )
}

const part1 = (ins: Instruction[]): number => {
  let answer = 0
  const interesting = [
    20, 60, 100, 140, 180, 220
  ]
  run(ins, (state) => {
    if (interesting.includes(state[0])) {
      answer += state[0] * state[1]
    }
  })
  return answer
}

describe("day10", () => {
  it("can do a noop", () => {
    expect(doInstruction(newMachine(), { op: "noop" })).toStrictEqual([[2, 1]]);
  });
  it("can do a add", () => {
    expect(doInstruction(newMachine(), { op: "addx", x: 5 })).toStrictEqual([
      [2, 1],
      [3, 6],
    ]);
  });

  it("can do the tiny program", () => {
    let lastState: any
    run([
      {op: "noop"},
      {op: "addx", x: 3},
      {op: "addx", x: -5},
    ], (state) => {lastState = state})
    expect(lastState).toStrictEqual([6, -1])
  })

  describe("part1", ()=>{
    it("can do the sample", () => {
      expect(part1(parse(testData))).toBe(13140)
    })
    it("can do the problem", () => {
      expect(part1(parse(input))).toBe(14220)
    })
  })
});
