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
    this.updateLabel();
  }

  copy(): State {
    return new State(
      this.junctions,
      this.position,
      this.score,
      this.time,
      [...this.open],
      [...this.log]
    );
  }

  doToggle(name: string): State {
    if (this.open.includes(name)) throw "oops already open " + name;
    const next = this.copy();
    next.log.push(
      `(${this.scoreIncrement()}) minute ${this.time} open ${name}`
    );
    next.addTime(1);
    next.open.push(name);
    return next;
  }

  doMove(nextPlace: string, cost: number): State {
    const next = this.copy();
    next.log.push(
      `(${this.scoreIncrement()}) minute ${
        this.time
      } move ${nextPlace} /${cost}`
    );
    next.position = nextPlace;
    next.addTime(cost);
    return next;
  }

  addTime(n: number = 1) {
    this.time += n;
    R.range(0, n).forEach(() => {
      this.addScore();
    });
    this.updateLabel();
  }

  updateLabel() {
    this.label = this.open.sort().join(",");
  }

  addScore(): void {
    this.score += this.scoreIncrement();
  }

  scoreIncrement(): number {
    return R.sum(
      this.junctions
        .filter((j) => this.open.includes(j.name))
        .map((j) => j.flowRate)
    );
  }
}

const search = (map: PipeMap, steps = 30): State => {
  const initialState = new State(map);
  const stateHeap = new Heap<State>((a, b) => a.time - b.time);
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
  const projectedScore = (state: State) => {
    return state.score;
    return (steps - state.time) * state.scoreIncrement() + state.score;
  };

  let best: State = initialState;
  const search = (state: State) => {
    if (state.time > steps) {
      if (state.score > best.score) {
        best = state;
      }
      return;
    }
    const node = junctions[state.position];
    if (node.flowRate != 0 && !state.open.includes(node.name)) {
      const newOpen = state.doToggle(node.name);
      const scoreWhenOpenLabel = newOpen.label; // + "@" + newOpen.time
      if (
        scoreWhenOpenLabel in scoreWhenOpen &&
        scoreWhenOpen[scoreWhenOpenLabel] > projectedScore(newOpen)
      ) {
        // loop protection
        return;
      } else {
        scoreWhenOpen[scoreWhenOpenLabel] = newOpen.score
      }
      stateHeap.push(newOpen);
    }

    for (const [nextPlace, cost, junction] of paths[node.name]) {
      const newPosition = state.doMove(nextPlace, cost);
      const posLabel = nextPlace + "+" + newPosition.label + "@" + newPosition.time;
      if (
        posLabel in scoreWhenAt &&
        scoreWhenAt[posLabel] >= projectedScore(newPosition)
      ) {
        // loop protection
        // if (node.name == "EE" && state.label == "BB,DD,JJ") throw "oops skip EE"
        return;
      } else {
        // if (node.name == "EE" && state.label == "BB,DD,JJ") throw "oops no skip EE " + nextPlace
        scoreWhenAt[posLabel] = newPosition.score
      }
      // if (node.name == "EE" && state.label == "BB,DD,HH,JJ") throw "oops skip EE " + state.log.join("\n")

      stateHeap.push(newPosition);
    }
  };

  let limit = 2_000_000;
  let stepCount = 0;
  while (stateHeap.size()) {
    const state = stateHeap.pop();
    search(state);
    limit--;
    stepCount++;
    if (limit == 0) {
      console.log({ best, state, len: stateHeap.size() });
      throw "limit break";
    }
  }
  console.log({ stepCount });
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
  return text.trim().split("\n").map((line) => {
    const bits = line.trim().split(/[ =;]/g);
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
  console.log({ result, incr: result.scoreIncrement() });
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

  describe("test cases from reddit", () => {
    it("can solve a line", () => {
      const inData = `
      Valve LA has flow rate=22; tunnels lead to valves KA, MA
      Valve MA has flow rate=24; tunnels lead to valves LA, NA
      Valve NA has flow rate=26; tunnels lead to valves MA, OA
      Valve OA has flow rate=28; tunnels lead to valves NA, PA
      Valve PA has flow rate=30; tunnels lead to valves OA
      Valve AA has flow rate=0; tunnels lead to valves BA
      Valve BA has flow rate=2; tunnels lead to valves AA, CA
      Valve CA has flow rate=4; tunnels lead to valves BA, DA
      Valve DA has flow rate=6; tunnels lead to valves CA, EA
      Valve EA has flow rate=8; tunnels lead to valves DA, FA
      Valve FA has flow rate=10; tunnels lead to valves EA, GA
      Valve GA has flow rate=12; tunnels lead to valves FA, HA
      Valve HA has flow rate=14; tunnels lead to valves GA, IA
      Valve IA has flow rate=16; tunnels lead to valves HA, JA
      Valve JA has flow rate=18; tunnels lead to valves IA, KA
      Valve KA has flow rate=20; tunnels lead to valves JA, LA
      `;
      expect(part1(parse(inData))).toBe(2640)
    })
  })

  describe.skip("part 1", () => {
    it("sample", () => {
      expect(part1(parse(testData))).toBe(1651);
    });
  });
});
