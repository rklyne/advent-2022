import * as R from "ramda";
import Heap from "heap";

import { data, testData } from "./input";

type Junction = { name: string; moves: string[]; flowRate: number };
type PipeMap = Junction[];

class State {
  open: string[];
  label: string;

  constructor(
    private junctions: PipeMap,
    public position: string = "AA",
    public score: number = 0,
    public time: number = 1,
    open: string[] = [],
    public log: string[] = []
  ) {
    this.open = open;
    this.label = this.open.sort().join(",");
  }

  copy(): State {
    return new State(this.junctions, this.position, this.score, this.time, [
      ...this.open,
    ], [...this.log]);
  }

  doToggle(name: string): State {
    if (this.open.includes(name)) throw "oops already open " + name;
    const next = this.copy();
    next.log.push(`(${this.scoreIncrement()}) minute ${this.time} open ${name}`);
    next.addTime(1);
    next.open.push(name);
    return next;
  }

  doMove(nextPlace: string, cost: number): State {
    const next = this.copy();
    next.log.push(`(${this.scoreIncrement()}) minute ${this.time} move ${nextPlace} /${cost}`)
    next.position = nextPlace;
    next.addTime(cost);
    return next;
  }

  addTime(n: number = 1) {
    this.time += n;
    R.range(0, n).forEach(() => {
      this.addScore();
    });
  }

  addScore(): void {
    this.score += this.scoreIncrement()
  }

  scoreIncrement(): number {
    return R.sum(
      this.junctions.filter((j) => this.open.includes(j.name)).map((j) => j.flowRate)
    );
  }
}



const search = (map: PipeMap, steps = 30): State => {
  const initialState = new State(map);
  const stateHeap = new Heap<State>((a, b) => a.score - b.score);
  stateHeap.push(initialState);
  const junctions: Record<string, Junction> = Object.fromEntries(
    map.map((junction) => [junction.name, junction])
  );

  const paths: Record<string, [string, number, Junction][]> =
    Object.fromEntries(
      map.map((junction) => [
        junction.name,
        junction.moves.map((name) => [name, 1, junctions[name]]),
      ])
    );
  // TODO: shortcut paths
  for (const junction of map) {
    paths[junction.name] = junction.moves.map((move) => [
      move,
      1,
      junctions[move],
    ]);
  }

  const scoreWhenOpen: Record<string, number> = {};
  const scoreWhenAt: Record<string, number> = {};

  let best: State = initialState;
  const search = (state: State) => {
    if (state.time > steps) {
      if (state.score >= best.score) {
        best = state
      }
      return;
    }
    const node = junctions[state.position];
    if (node.flowRate != 0 && !(state.open.includes(node.name))) {
      const newOpen = state.doToggle(node.name);
      if (
        newOpen.label in scoreWhenOpen &&
        scoreWhenOpen[newOpen.label] > newOpen.score
      ) {
        // loop protection
        return;
      } else {
        scoreWhenOpen[newOpen.label] = newOpen.score;
      }
      stateHeap.push(newOpen);
    }
    for (const [nextPlace, cost, junction] of paths[node.name]) {
      const newPosition = state.doMove(nextPlace, cost)
      const posLabel = nextPlace+"+"+state.label
      if (
        posLabel in scoreWhenAt &&
        scoreWhenAt[posLabel] >= newPosition.score
      ) {
        // loop protection
        return;
      } else {
        scoreWhenAt[posLabel] = newPosition.score;
      }
      stateHeap.push(newPosition);
    }
  };

  let limit = 20000;
  while (stateHeap.size()) {
    const state = stateHeap.pop()
    search(state);
    limit--;
    if (limit == 0) {
      console.log({best, state})
      throw "limit break";
    }
  }

  return best;
};

/**
 * algorithm
 * - search at AA
 * to search:
 * - options = moves + switch (if flowRate != 0)
 * - for each option, from the most time remaining
 *   - if time is at the limit then check if it's the best solution. if yes, keep it.
 *   - if this new option is the best way to reach that place + value setup then search
 * -
 */

const parse = (text: string): PipeMap => {
  //Valve CC has flow rate=2; tunnels lead to valves DD, BB
  //
  return text.split("\n").map((line) => {
    const bits = line.split(/[ =;]/g);
    return {
      moves: line
        .split("valve")[1]
        .slice(1)
        .trim()
        .split(",")
        .map((s) => s.trim()),
      flowRate: parseInt(bits[5]),
      name: bits[1],
    };
  });
};

const part1 = (map: PipeMap) => {
  const result = search(map);
  console.log({result})
  return result.score;
};
describe("day 16", () => {
  it("parses", () => {
    expect(parse(testData)[0]).toStrictEqual({
      moves: ["DD", "II", "BB"],
      name: "AA",
      flowRate: 0,
    });
  });

  it("can search", () => {
    const ns = [
'(0) minute 1 move DD /1',
'(0) minute 2 open DD',
'(20) minute 3 move CC /1',
'(20) minute 4 move BB /1',
'(20) minute 5 open BB',
'(33) minute 6 move AA /1',
'(33) minute 7 move II /1',
'(33) minute 8 move JJ /1',
'(33) minute 9 open JJ',
'(54) minute 10 move II /1',
'(54) minute 11 move AA /1',
'(54) minute 12 move BB /1',
'(54) minute 13 move CC /1',
'(54) minute 14 open CC',
'(56) minute 15 move DD /1',
'(56) minute 16 move EE /1',
'(56) minute 17 move FF /1',
'(56) minute 18 move GG /1',
'(56) minute 19 move HH /1',
'(56) minute 20 open HH',
'(78) minute 21 move GG /1',
'(78) minute 22 move FF /1',
'(78) minute 23 move EE /1',
'(78) minute 24 open EE',
'(81) minute 25 move DD /1',
'(81) minute 26 move EE /1',
'(81) minute 27 move DD /1',
'(81) minute 28 move EE /1',
'(81) minute 29 move FF /1',
'(81) minute 30 move GG /1'
    ].map(l => parseInt(l.split(")")[0].slice(1)))
    expect(R.sum(ns)).toBe("bad")
  });

  describe("part 1", () => {
    it("sample", () => {
      expect(part1(parse(testData))).toBe(1651);
    });
  });


});
