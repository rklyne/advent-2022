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
    protected pathSinceOpening: Set<string> = new Set(),
    public log: string[] = []
  ) {
    this.open = open;
    this.updateLabel();
  }

  get id() {
    return this.label + "@" + this.time;
  }

  copy(): State {
    return new State(
      this.junctions,
      this.position,
      this.score,
      this.time,
      [...this.open],
      new Set(this.pathSinceOpening),
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
    next.pathSinceOpening.clear();
    return next;
  }

  seen(nextPlace: string): boolean {
    if (this.pathSinceOpening.has(nextPlace)) return true;
    return false;
  }

  doMove(nextPlace: string, cost: number): State {
    const next = this.copy();
    next.log.push(
      `(${this.scoreIncrement()}) minute ${
        this.time
      } move ${nextPlace} /${cost}`
    );
    next.position = nextPlace;
    next.pathSinceOpening.add(nextPlace);
    next.addTime(cost);
    return next;
  }

  wait(time: number): State {
    const next = this.copy();
    next.log.push(
      `(${this.scoreIncrement()}) minute ${this.time} wait ${time}`
    );
    next.addTime(time);
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
    return (
      R.sum(
        this.junctions
          .filter((j) => this.open.includes(j.name))
          .map((j) => j.flowRate)
      )
    );
  }
}

type DistMap = Record<string, number>;
type Graph = Record<string, DistMap>;
const shortestDistanceNode = (
  distances: Record<string, number>,
  visited: Set<string>
) => {
  let shortest = null;

  for (let node in distances) {
    let currentIsShortest =
      shortest === null || distances[node] < distances[shortest];
    if (currentIsShortest && !visited.has(node)) {
      shortest = node;
    }
  }
  return shortest;
};
const findShortestPaths = (
  graph: Graph,
  startNode: string,
  endNodes: string[]
) => {
  // establish object for recording distances from the start node
  let distances: Record<string, number> = {};
  distances = Object.assign(distances, graph[startNode]);

  // track paths
  const parents: Record<string, string> = { endNode: null };
  for (let child in graph[startNode]) {
    parents[child] = startNode;
  }

  // track nodes that have already been visited
  let visited: Set<string> = new Set();

  // find the nearest node
  let node = shortestDistanceNode(distances, visited);

  // for that node
  while (node) {
    // move the node to the visited set
    visited.add(node);
    // find its distance from the start node & its child nodes
    let distance = distances[node];
    let children = graph[node];
    // for each of those child nodes
    for (let child in children) {
      // make sure each child node is not the start node
      if (child === startNode) {
        continue;
      } else {
        // save the distance from the start node to the child node
        let newdistance = distance + children[child];
        // if there's no recorded distance from the start node to the child node in the distances object
        // or if the recorded distance is shorter than the previously stored distance from the start node to the child node
        // save the distance to the object
        // record the path
        if (!distances[child] || distances[child] > newdistance) {
          distances[child] = newdistance;
          parents[child] = node;
        }
      }
    }
    // move to the nearest neighbor node
    node = shortestDistanceNode(distances, visited);
  }

  // using the stored paths from start node to end node
  // record the shortest path
  const endNodeData = R.sortBy(
    R.prop("distance"),
    endNodes
      .filter((n) => distances[n])
      .map((n) => ({ distance: distances[n], n }))
  );
  const endNode = R.head(endNodeData).n;
  let shortestPath = [endNode];
  let parent = parents[endNode];
  while (parent) {
    shortestPath.push(parent);
    parent = parents[parent];
  }
  shortestPath.reverse();

  // return the shortest path from start node to end node & its distance
  let results = {
    distance: distances[endNode],
    path: shortestPath,
    distances,
  };

  return results;
};
// returns {fromNode: {toNode: cost}}
const buildShortestPathMatrix = (
  map: PipeMap
): Record<string, Record<string, number>> => {
  const toNodes = map
    .filter((j) => j.flowRate != 0)
    .map((junction) => junction.name);
  const fromNodes = ["AA", ...toNodes];
  const result = {};
  const graph = Object.fromEntries(
    map.map((junction) => [
      junction.name,
      Object.fromEntries(junction.moves.map((n) => [n, 1])),
    ])
  );

  for (const fromNode of fromNodes) {
    const paths = findShortestPaths(graph, fromNode, toNodes);
    result[fromNode] = {};
    for (const toNode of toNodes) {
      if (fromNode != toNode)
        result[fromNode][toNode] = paths.distances[toNode];
    }
  }
  return result;
};

type BasicState = {
  id: string;
  score: number;
};
const part1Search = (map: PipeMap, steps = 30) => {
  const initialState = new State(map);
  const counters: Record<string, number> = {};
  const count = (n: string) => {
    if (!(n in counters)) {
      counters[n] = 0;
    }
    counters[n] += 1;
  };
  const searcher = () => {
    const scoreWhenOpen: Record<string, number> = {};
    const scoreWhenAt: Record<string, number> = {};
    const junctions: Record<string, Junction> = Object.fromEntries(
      map.map((junction) => [junction.name, junction])
    );
    const paths: Record<string, [string, number, Junction][]> = {};
    /*
      Object.fromEntries(
        map.map((junction) => [
          junction.name,
          junction.moves.map((name) => [name, 1, junctions[name]]),
        ])
      );
      */

    const shortestPaths = buildShortestPathMatrix(map);
    for (const fromNode of Object.keys(shortestPaths)) {
      const junction = junctions[fromNode];
      paths[junction.name] = Object.entries(shortestPaths[junction.name]).map(
        ([toNode, cost]) => [toNode, cost, junctions[toNode]]
      );
    }

    return (state: State) => {
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
      const node = junctions[state.position];
      const choices: State[] = [];
      let acted = false;
      if (false && node.flowRate != 0 && !state.open.includes(node.name)) {
        const newOpen = state.doToggle(node.name);
        const scoreWhenOpenLabel = newOpen.label;
        if (
          scoreWhenOpenLabel in scoreWhenOpen &&
          scoreWhenOpen[scoreWhenOpenLabel] > newOpen.score
        ) {
          // loop protection
          count("non_optimal_open");
          return [];
        } else {
          count("open");
          scoreWhenOpen[scoreWhenOpenLabel] = newOpen.score;
          choices.push(newOpen);
          acted = true;
        }
      }

      for (const [nextPlace, cost, junction] of paths[node.name]) {
        if (state.open.includes(nextPlace)) {
          count("already_open")
          continue
        };
        if (state.seen(nextPlace)) {
          count("no_backtrack");
          continue;
        }
        const newPosition = state.doMove(nextPlace, cost).doToggle(nextPlace);
        if (cost > (steps - state.time)) {
          count("time_exceeded")
          continue
        };
        const posLabel =
          nextPlace + "+" + newPosition.label + "@" + newPosition.time;
        if (
          posLabel in scoreWhenAt &&
          scoreWhenAt[posLabel] >= newPosition.score
        ) {
          // loop protection
          count("non_optimal");
          continue;
        } else {
          scoreWhenAt[posLabel] = newPosition.score;
          count("move");
          choices.push(newPosition);
          acted = true;
        }
      }
      if (!acted) {
        count("wait");
        choices.push(state.wait(1));
      }
      return choices;
    };
  };
  const result = runSearch(
    initialState,
    searcher(),
    (state) => state.time > steps,
    {
      priority: (a, b) => a.time - b.time,
    }
  );
  console.log({ counters });
  return result;
};
const runSearch = <State extends BasicState>(
  initialState: State,
  choices: (state: State) => State[],
  isComplete: (state: State) => boolean,
  { priority }: { priority?: (me: State, other: State) => number } = {}
): State => {
  const stateHeap = new Heap<State>(priority);
  stateHeap.push(initialState);
  const scoreWhenOpen: Record<string, number> = {};
  const scoreWhenAt: Record<string, number> = {};

  let best: State = initialState;

  let limit = 1_000_000;
  let stepCount = 0;
  const visited: Record<string, number> = {};
  while (stateHeap.size()) {
    const state = stateHeap.pop();
    if (isComplete(state)) {
      if (state.score > best.score) {
        best = state;
      }
      continue;
    }
    for (const choice of choices(state)) {
      if (choice.id in visited && visited[choice.id] > choice.score) continue;
      visited[choice.id] = choice.score;
      stateHeap.push(choice);
    }
    limit--;
    stepCount++;
    if (limit == 0) {
      console.log({ best, state, len: stateHeap.size() });
      console.log("LIMIT BREAK");
      throw "limit break";
    }
  }
  console.log({ stepCount });
  return best;
};

const parse = (text: string): PipeMap => {
  //Valve CC has flow rate=2; tunnels lead to valves DD, BB
  //
  return text
    .trim()
    .split("\n")
    .map((line) => {
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
  const result = part1Search(map);
  console.log({ msg: "part 1 done", result });
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

  describe.skip("test cases from reddit", () => {
    describe("can solve a line", () => {
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
      it("part1", () => {
        expect(part1(parse(inData))).toBe(2640);
      });
    });

    describe("line, quadratic rates", () => {
      const inData = `
      Valve AA has flow rate=0; tunnels lead to valves BA
      Valve BA has flow rate=1; tunnels lead to valves AA, CA
      Valve CA has flow rate=4; tunnels lead to valves BA, DA
      Valve DA has flow rate=9; tunnels lead to valves CA, EA
      Valve EA has flow rate=16; tunnels lead to valves DA, FA
      Valve FA has flow rate=25; tunnels lead to valves EA, GA
      Valve GA has flow rate=36; tunnels lead to valves FA, HA
      Valve HA has flow rate=49; tunnels lead to valves GA, IA
      Valve IA has flow rate=64; tunnels lead to valves HA, JA
      Valve JA has flow rate=81; tunnels lead to valves IA, KA
      Valve KA has flow rate=100; tunnels lead to valves JA, LA
      Valve LA has flow rate=121; tunnels lead to valves KA, MA
      Valve MA has flow rate=144; tunnels lead to valves LA, NA
      Valve NA has flow rate=169; tunnels lead to valves MA, OA
      Valve OA has flow rate=196; tunnels lead to valves NA, PA
      Valve PA has flow rate=225; tunnels lead to valves OA
      `;
      it("part1", () => {
        expect(part1(parse(inData))).toBe(13468);
      });
    });

    describe("circle", () => {
      const inData = `
      Valve BA has flow rate=2; tunnels lead to valves AA, CA
      Valve CA has flow rate=10; tunnels lead to valves BA, DA
      Valve DA has flow rate=2; tunnels lead to valves CA, EA
      Valve EA has flow rate=10; tunnels lead to valves DA, FA
      Valve FA has flow rate=2; tunnels lead to valves EA, GA
      Valve GA has flow rate=10; tunnels lead to valves FA, HA
      Valve HA has flow rate=2; tunnels lead to valves GA, IA
      Valve IA has flow rate=10; tunnels lead to valves HA, JA
      Valve JA has flow rate=2; tunnels lead to valves IA, KA
      Valve KA has flow rate=10; tunnels lead to valves JA, LA
      Valve LA has flow rate=2; tunnels lead to valves KA, MA
      Valve MA has flow rate=10; tunnels lead to valves LA, NA
      Valve NA has flow rate=2; tunnels lead to valves MA, OA
      Valve OA has flow rate=10; tunnels lead to valves NA, PA
      Valve PA has flow rate=2; tunnels lead to valves OA, AA
      Valve AA has flow rate=0; tunnels lead to valves BA, PA
      `;
      it("part1", () => {
        expect(part1(parse(inData))).toBe(1288);
      });
    });

    describe("clusters", () => {
      const inData = `
      Valve AK has flow rate=100; tunnels lead to valves AJ, AW, AX, AY, AZ
      Valve AW has flow rate=10; tunnels lead to valves AK
      Valve AX has flow rate=10; tunnels lead to valves AK
      Valve AY has flow rate=10; tunnels lead to valves AK
      Valve AZ has flow rate=10; tunnels lead to valves AK
      Valve BB has flow rate=0; tunnels lead to valves AA, BC
      Valve BC has flow rate=0; tunnels lead to valves BB, BD
      Valve BD has flow rate=0; tunnels lead to valves BC, BE
      Valve BE has flow rate=0; tunnels lead to valves BD, BF
      Valve BF has flow rate=0; tunnels lead to valves BE, BG
      Valve BG has flow rate=0; tunnels lead to valves BF, BH
      Valve BH has flow rate=0; tunnels lead to valves BG, BI
      Valve BI has flow rate=0; tunnels lead to valves BH, BJ
      Valve BJ has flow rate=0; tunnels lead to valves BI, BK
      Valve BK has flow rate=100; tunnels lead to valves BJ, BW, BX, BY, BZ
      Valve BW has flow rate=10; tunnels lead to valves BK
      Valve BX has flow rate=10; tunnels lead to valves BK
      Valve BY has flow rate=10; tunnels lead to valves BK
      Valve BZ has flow rate=10; tunnels lead to valves BK
      Valve CB has flow rate=0; tunnels lead to valves AA, CC
      Valve CC has flow rate=0; tunnels lead to valves CB, CD
      Valve CD has flow rate=0; tunnels lead to valves CC, CE
      Valve CE has flow rate=0; tunnels lead to valves CD, CF
      Valve CF has flow rate=0; tunnels lead to valves CE, CG
      Valve CG has flow rate=0; tunnels lead to valves CF, CH
      Valve CH has flow rate=0; tunnels lead to valves CG, CI
      Valve CI has flow rate=0; tunnels lead to valves CH, CJ
      Valve CJ has flow rate=0; tunnels lead to valves CI, CK
      Valve CK has flow rate=100; tunnels lead to valves CJ, CW, CX, CY, CZ
      Valve CW has flow rate=10; tunnels lead to valves CK
      Valve CX has flow rate=10; tunnels lead to valves CK
      Valve CY has flow rate=10; tunnels lead to valves CK
      Valve CZ has flow rate=10; tunnels lead to valves CK
      Valve AA has flow rate=0; tunnels lead to valves AB, BB, CB
      Valve AB has flow rate=0; tunnels lead to valves AA, AC
      Valve AC has flow rate=0; tunnels lead to valves AB, AD
      Valve AD has flow rate=0; tunnels lead to valves AC, AE
      Valve AE has flow rate=0; tunnels lead to valves AD, AF
      Valve AF has flow rate=0; tunnels lead to valves AE, AG
      Valve AG has flow rate=0; tunnels lead to valves AF, AH
      Valve AH has flow rate=0; tunnels lead to valves AG, AI
      Valve AI has flow rate=0; tunnels lead to valves AH, AJ
      Valve AJ has flow rate=0; tunnels lead to valves AI, AK
      `;
      it("part1", () => {
        expect(part1(parse(inData))).toBe(2400);
      });
    });
  });

  describe("part 1", () => {
    it("sample", () => {
      expect(part1(parse(testData))).toBe(1651);
    });

    it("answer", () => {
      expect(part1(parse(data))).toBe(1720);
      // 1718 too low
      // 1834 too high
    });
  });
});
